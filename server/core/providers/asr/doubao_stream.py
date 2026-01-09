import json
import gzip
import uuid
import asyncio
import websockets
import opuslib_next
from core.providers.asr.base import ASRProviderBase
from config.logger import setup_logging
from core.providers.asr.dto.dto import InterfaceType

TAG = __name__
logger = setup_logging()


class ASRProvider(ASRProviderBase):
    def __init__(self, config, delete_audio_file):
        super().__init__()
        self.interface_type = InterfaceType.STREAM
        self.config = config
        self.text = ""
        self.decoder = opuslib_next.Decoder(16000, 1)
        self.asr_ws = None
        self.forward_task = None
        self.is_processing = False  # 添加处理状态标志

        # 配置参数
        self.appid = str(config.get("appid"))
        self.cluster = config.get("cluster")
        self.access_token = config.get("access_token")
        self.boosting_table_name = config.get("boosting_table_name", "")
        self.correct_table_name = config.get("correct_table_name", "")
        self.output_dir = config.get("output_dir", "tmp/")
        self.delete_audio_file = delete_audio_file

        # 火山引擎ASR配置
        # 模式选择：bigmodel (标准双向流式) / bigmodel_async (优化版，推荐) / bigmodel_nostream (流式输入)
        self.stream_mode = config.get("stream_mode", "bigmodel_async")

        # 根据模式选择接口地址
        mode_urls = {
            "bigmodel": "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel",
            "bigmodel_async": "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async",
            "bigmodel_nostream": "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_nostream"
        }
        self.ws_url = mode_urls.get(self.stream_mode, mode_urls["bigmodel_async"])

        self.uid = config.get("uid", "streaming_asr_service")
        self.workflow = config.get(
            "workflow", "audio_in,resample,partition,vad,fe,decode,itn,nlu_punctuate"
        )
        self.result_type = config.get("result_type", "single")
        self.format = config.get("format", "pcm")
        self.codec = config.get("codec", "pcm")
        self.rate = config.get("sample_rate", 16000)
        self.language = config.get("language", "zh-CN")
        self.bits = config.get("bits", 16)
        self.channel = config.get("channel", 1)
        self.auth_method = config.get("auth_method", "token")
        self.secret = config.get("secret", "access_secret")
        # Resource ID配置：
        # 豆包流式语音识别模型1.0: volc.bigasr.sauc.duration (小时版) / volc.bigasr.sauc.concurrent (并发版)
        # 豆包流式语音识别模型2.0: volc.seedasr.sauc.duration (小时版) / volc.seedasr.sauc.concurrent (并发版)
        self.resource_id = config.get("resource_id", "volc.bigasr.sauc.duration")
        end_window_size = config.get("end_window_size")
        self.end_window_size = int(end_window_size) if end_window_size else 200

    async def open_audio_channels(self, conn):
        await super().open_audio_channels(conn)

    async def receive_audio(self, conn, audio, audio_have_voice):
        conn.asr_audio.append(audio)
        conn.asr_audio = conn.asr_audio[-10:]
        # 存储音频数据
        if not hasattr(conn, 'asr_audio_for_voiceprint'):
            conn.asr_audio_for_voiceprint = []
        conn.asr_audio_for_voiceprint.append(audio)

        # 当没有音频数据时处理完整语音片段
        if conn.client_listen_mode != "manual" and not audio and len(conn.asr_audio_for_voiceprint) > 0:
            await self.handle_voice_stop(conn, conn.asr_audio_for_voiceprint)
            conn.asr_audio_for_voiceprint = []

        # 如果本次有声音，且之前没有建立连接
        if audio_have_voice and self.asr_ws is None and not self.is_processing:
            try:
                self.is_processing = True
                # 建立新的WebSocket连接
                headers = self.token_auth() if self.auth_method == "token" else None
                logger.bind(tag=TAG).info(f"正在连接ASR服务 [{self.stream_mode}]")
                logger.bind(tag=TAG).info(f"接口地址: {self.ws_url}")
                logger.bind(tag=TAG).debug(f"认证headers: {headers}")

                self.asr_ws = await websockets.connect(
                    self.ws_url,
                    additional_headers=headers,
                    max_size=1000000000,
                    ping_interval=None,
                    ping_timeout=None,
                    close_timeout=10,
                )

                # 发送初始化请求
                request_params = self.construct_request(str(uuid.uuid4()))
                try:
                    payload_bytes = str.encode(json.dumps(request_params))
                    payload_bytes = gzip.compress(payload_bytes)
                    full_client_request = self.generate_header()
                    full_client_request.extend((len(payload_bytes)).to_bytes(4, "big"))
                    full_client_request.extend(payload_bytes)

                    logger.bind(tag=TAG).info(f"发送初始化请求: {request_params}")
                    await self.asr_ws.send(full_client_request)

                    # 等待初始化响应
                    init_res = await self.asr_ws.recv()
                    result = self.parse_response(init_res)
                    logger.bind(tag=TAG).info(f"收到初始化响应: {result}")

                    # 检查初始化响应
                    if "code" in result and result["code"] != 1000:
                        error_msg = f"ASR服务初始化失败: {result.get('payload_msg', {}).get('error', '未知错误')}"
                        logger.bind(tag=TAG).error(error_msg)
                        raise Exception(error_msg)

                except Exception as e:
                    logger.bind(tag=TAG).error(f"发送初始化请求失败: {str(e)}")
                    if hasattr(e, "__cause__") and e.__cause__:
                        logger.bind(tag=TAG).error(f"错误原因: {str(e.__cause__)}")
                    raise e

                # 启动接收ASR结果的异步任务
                self.forward_task = asyncio.create_task(self._forward_asr_results(conn))

                # 发送缓存的音频数据
                if conn.asr_audio and len(conn.asr_audio) > 0:
                    for cached_audio in conn.asr_audio[-10:]:
                        try:
                            pcm_frame = self.decoder.decode(cached_audio, 960)
                            payload = gzip.compress(pcm_frame)
                            audio_request = bytearray(
                                self.generate_audio_default_header()
                            )
                            audio_request.extend(len(payload).to_bytes(4, "big"))
                            audio_request.extend(payload)
                            await self.asr_ws.send(audio_request)
                        except Exception as e:
                            logger.bind(tag=TAG).info(
                                f"发送缓存音频数据时发生错误: {e}"
                            )

            except Exception as e:
                error_msg = str(e)
                logger.bind(tag=TAG).error(f"建立ASR连接失败: {error_msg}")

                # 针对HTTP 403错误提供详细的诊断信息
                if "403" in error_msg or "rejected" in error_msg:
                    logger.bind(tag=TAG).error("=" * 60)
                    logger.bind(tag=TAG).error("HTTP 403 错误诊断：")
                    logger.bind(tag=TAG).error(f"1. 检查 App Key: {self.appid}")
                    logger.bind(tag=TAG).error(f"2. 检查 Access Token: {self.access_token[:10]}...")
                    logger.bind(tag=TAG).error(f"3. 检查 Resource ID: {self.resource_id}")
                    logger.bind(tag=TAG).error("4. 确认火山引擎控制台已开通语音识别服务")
                    logger.bind(tag=TAG).error("5. 确认Access Token未过期")
                    logger.bind(tag=TAG).error("6. 检查是否选择了正确的计费模式（小时版/并发版）")
                    logger.bind(tag=TAG).error("可用的Resource ID:")
                    logger.bind(tag=TAG).error("  - volc.bigasr.sauc.duration (1.0小时版)")
                    logger.bind(tag=TAG).error("  - volc.bigasr.sauc.concurrent (1.0并发版)")
                    logger.bind(tag=TAG).error("  - volc.seedasr.sauc.duration (2.0小时版,推荐)")
                    logger.bind(tag=TAG).error("  - volc.seedasr.sauc.concurrent (2.0并发版)")
                    logger.bind(tag=TAG).error("=" * 60)

                if hasattr(e, "__cause__") and e.__cause__:
                    logger.bind(tag=TAG).error(f"错误原因: {str(e.__cause__)}")
                if self.asr_ws:
                    await self.asr_ws.close()
                    self.asr_ws = None
                self.is_processing = False
                return

        # 发送当前音频数据
        if self.asr_ws and self.is_processing:
            try:
                pcm_frame = self.decoder.decode(audio, 960)
                payload = gzip.compress(pcm_frame)
                audio_request = bytearray(self.generate_audio_default_header())
                audio_request.extend(len(payload).to_bytes(4, "big"))
                audio_request.extend(payload)
                await self.asr_ws.send(audio_request)
            except Exception as e:
                logger.bind(tag=TAG).info(f"发送音频数据时发生错误: {e}")

    async def _forward_asr_results(self, conn):
        try:
            while self.asr_ws and not conn.stop_event.is_set():
                # 获取当前连接的音频数据
                audio_data = getattr(conn, 'asr_audio_for_voiceprint', [])
                try:
                    response = await self.asr_ws.recv()
                    result = self.parse_response(response)
                    logger.bind(tag=TAG).debug(f"收到ASR结果: {result}")

                    if "payload_msg" in result:
                        payload = result["payload_msg"]
                        # 检查是否是错误码1013（无有效语音）
                        if "code" in payload and payload["code"] == 1013:
                            # 静默处理，不记录错误日志
                            continue

                        if "result" in payload:
                            utterances = payload["result"].get("utterances", [])
                            # 检查duration和空文本的情况
                            if (
                                payload.get("audio_info", {}).get("duration", 0) > 2000
                                and not utterances
                                and not payload["result"].get("text")
                                and conn.client_listen_mode != "manual"
                            ):
                                logger.bind(tag=TAG).error(f"识别文本：空")
                                self.text = ""
                                conn.reset_vad_states()
                                if len(audio_data) > 15:  # 确保有足够音频数据
                                    await self.handle_voice_stop(conn, audio_data)
                                break

                            # 专门处理没有文本的识别结果（手动模式下可能已经识别完成但是没松按键）
                            elif not payload["result"].get("text") and not utterances:
                                if conn.client_listen_mode == "manual" and conn.client_voice_stop and len(audio_data) > 0:
                                    logger.bind(tag=TAG).debug("消息结束收到停止信号，触发处理")
                                    await self.handle_voice_stop(conn, audio_data)
                                    # 清理音频缓存
                                    conn.asr_audio.clear()
                                    conn.reset_vad_states()
                                    break

                            for utterance in utterances:
                                if utterance.get("definite", False):
                                    current_text = utterance["text"]
                                    logger.bind(tag=TAG).info(
                                        f"识别到文本: {current_text}"
                                    )

                                    # 手动模式下累积识别结果
                                    if conn.client_listen_mode == "manual":
                                        if self.text:
                                            self.text += current_text
                                        else:
                                            self.text = current_text

                                        # 在接收消息中途时收到停止信号
                                        if conn.client_voice_stop and len(audio_data) > 0:
                                            logger.bind(tag=TAG).debug("消息中途收到停止信号，触发处理")
                                            await self.handle_voice_stop(conn, audio_data)
                                            # 清理音频缓存
                                            conn.asr_audio.clear()
                                            conn.reset_vad_states()
                                        break
                                    else:
                                        # 自动模式下直接覆盖
                                        self.text = current_text
                                        conn.reset_vad_states()
                                        if len(audio_data) > 15:  # 确保有足够音频数据
                                            await self.handle_voice_stop(conn, audio_data)
                                    break
                        elif "error" in payload:
                            error_msg = payload.get("error", "未知错误")
                            logger.bind(tag=TAG).error(f"ASR服务返回错误: {error_msg}")
                            break

                except websockets.ConnectionClosed:
                    logger.bind(tag=TAG).info("ASR服务连接已关闭")
                    self.is_processing = False
                    break
                except Exception as e:
                    logger.bind(tag=TAG).error(f"处理ASR结果时发生错误: {str(e)}")
                    if hasattr(e, "__cause__") and e.__cause__:
                        logger.bind(tag=TAG).error(f"错误原因: {str(e.__cause__)}")
                    self.is_processing = False
                    break

        except Exception as e:
            logger.bind(tag=TAG).error(f"ASR结果转发任务发生错误: {str(e)}")
            if hasattr(e, "__cause__") and e.__cause__:
                logger.bind(tag=TAG).error(f"错误原因: {str(e.__cause__)}")
        finally:
            if self.asr_ws:
                await self.asr_ws.close()
                self.asr_ws = None
            self.is_processing = False
            if conn:
                if hasattr(conn, 'asr_audio_for_voiceprint'):
                    conn.asr_audio_for_voiceprint = []
                if hasattr(conn, 'asr_audio'):
                    conn.asr_audio = []

    def stop_ws_connection(self):
        if self.asr_ws:
            asyncio.create_task(self.asr_ws.close())
            self.asr_ws = None
        self.is_processing = False

    async def _send_stop_request(self):
        """发送最后一个音频帧以通知服务器结束"""
        if self.asr_ws:
            try:
                # 发送结束标记的音频帧（gzip压缩的空数据）
                empty_payload = gzip.compress(b"")
                last_audio_request = bytearray(self.generate_last_audio_default_header())
                last_audio_request.extend(len(empty_payload).to_bytes(4, "big"))
                last_audio_request.extend(empty_payload)
                await self.asr_ws.send(last_audio_request)
                logger.bind(tag=TAG).debug("已发送结束音频帧")
            except Exception as e:
                logger.bind(tag=TAG).debug(f"发送结束音频帧时出错: {e}")

    def construct_request(self, reqid):
        req = {
            "app": {
                "appid": self.appid,
                "cluster": self.cluster,
                "token": self.access_token,
            },
            "user": {"uid": self.uid},
            "request": {
                "reqid": reqid,
                "workflow": self.workflow,
                "show_utterances": True,
                "result_type": self.result_type,
                "sequence": 1,
                "boosting_table_name": self.boosting_table_name,
                "correct_table_name": self.correct_table_name,
                "end_window_size": self.end_window_size,
            },
            "audio": {
                "format": self.format,
                "codec": self.codec,
                "rate": self.rate,
                "language": self.language,
                "bits": self.bits,
                "channel": self.channel,
                "sample_rate": self.rate,
            },
        }
        logger.bind(tag=TAG).debug(
            f"构造请求参数: {json.dumps(req, ensure_ascii=False)}"
        )
        return req

    def token_auth(self):
        return {
            "X-Api-App-Key": self.appid,
            "X-Api-Access-Key": self.access_token,
            "X-Api-Resource-Id": self.resource_id,
            "X-Api-Connect-Id": str(uuid.uuid4()),
        }

    def generate_header(
        self,
        version=0x01,
        message_type=0x01,
        message_type_specific_flags=0x00,
        serial_method=0x01,
        compression_type=0x01,
        reserved_data=0x00,
        extension_header: bytes = b"",
    ):
        header = bytearray()
        header_size = int(len(extension_header) / 4) + 1
        header.append((version << 4) | header_size)
        header.append((message_type << 4) | message_type_specific_flags)
        header.append((serial_method << 4) | compression_type)
        header.append(reserved_data)
        header.extend(extension_header)
        return header

    def generate_audio_default_header(self):
        return self.generate_header(
            version=0x01,
            message_type=0x02,
            message_type_specific_flags=0x00,
            serial_method=0x01,
            compression_type=0x01,
        )

    def generate_last_audio_default_header(self):
        return self.generate_header(
            version=0x01,
            message_type=0x02,
            message_type_specific_flags=0x02,
            serial_method=0x01,
            compression_type=0x01,
        )

    def parse_response(self, res: bytes) -> dict:
        try:
            # 检查响应长度
            if len(res) < 4:
                logger.bind(tag=TAG).error(f"响应数据长度不足: {len(res)}")
                return {"error": "响应数据长度不足"}

            # 解析Header (4字节)
            header = res[:4]
            protocol_version = (header[0] >> 4) & 0x0F
            header_size = (header[0] & 0x0F) * 4
            message_type = (header[1] >> 4) & 0x0F
            message_type_specific_flags = header[1] & 0x0F
            serial_method = (header[2] >> 4) & 0x0F
            compression_type = header[2] & 0x0F

            logger.bind(tag=TAG).debug(f"协议头: version={protocol_version}, header_size={header_size}, "
                                       f"message_type={message_type:#x}, flags={message_type_specific_flags:#x}, "
                                       f"serial={serial_method}, compression={compression_type}")

            # 如果是错误响应 (message_type = 0x0F)
            if message_type == 0x0F:  # SERVER_ERROR_RESPONSE
                code = int.from_bytes(res[header_size:header_size+4], "big", signed=False)
                msg_length = int.from_bytes(res[header_size+4:header_size+8], "big", signed=False)
                error_msg = json.loads(res[header_size+8:header_size+8+msg_length].decode("utf-8"))
                return {
                    "code": code,
                    "msg_length": msg_length,
                    "payload_msg": error_msg,
                }

            # Full server response (message_type = 0x09)
            offset = header_size

            # 检查是否有sequence number (通过message_type_specific_flags判断)
            if message_type_specific_flags & 0x01:  # 有sequence number
                if len(res) < offset + 4:
                    logger.bind(tag=TAG).error(f"数据长度不足以读取sequence: {len(res)}")
                    return {"error": "数据长度不足"}
                sequence = int.from_bytes(res[offset:offset+4], "big", signed=False)
                offset += 4
                logger.bind(tag=TAG).debug(f"Sequence number: {sequence}")

            # 读取payload size (4字节)
            if len(res) < offset + 4:
                logger.bind(tag=TAG).error(f"数据长度不足以读取payload size: {len(res)}")
                return {"error": "数据长度不足"}

            payload_size = int.from_bytes(res[offset:offset+4], "big", signed=False)
            offset += 4

            logger.bind(tag=TAG).debug(f"Payload size: {payload_size}, 剩余数据长度: {len(res) - offset}")

            # 读取payload
            if len(res) < offset + payload_size:
                logger.bind(tag=TAG).error(f"payload数据不完整: 期望{payload_size}字节, 实际{len(res) - offset}字节")
                return {"error": "payload数据不完整"}

            payload_bytes = res[offset:offset+payload_size]

            # 根据压缩类型解压
            if compression_type == 0x01:  # Gzip压缩
                try:
                    payload_bytes = gzip.decompress(payload_bytes)
                    logger.bind(tag=TAG).debug(f"Gzip解压后长度: {len(payload_bytes)}")
                except Exception as e:
                    logger.bind(tag=TAG).error(f"Gzip解压失败: {str(e)}")
                    return {"error": f"Gzip解压失败: {str(e)}"}

            # 根据序列化方法解析
            if serial_method == 0x01:  # JSON
                try:
                    json_str = payload_bytes.decode("utf-8")
                    result = json.loads(json_str)
                    logger.bind(tag=TAG).debug(f"成功解析JSON响应: {result}")
                    return {"payload_msg": result}
                except (UnicodeDecodeError, json.JSONDecodeError) as e:
                    logger.bind(tag=TAG).error(f"JSON解析失败: {str(e)}")
                    logger.bind(tag=TAG).error(f"原始payload: {payload_bytes[:200]}")
                    raise
            else:
                logger.bind(tag=TAG).error(f"不支持的序列化方法: {serial_method}")
                return {"error": f"不支持的序列化方法: {serial_method}"}

        except Exception as e:
            logger.bind(tag=TAG).error(f"解析响应失败: {str(e)}")
            logger.bind(tag=TAG).error(f"原始响应数据(hex): {res[:100].hex()}")
            raise

    async def speech_to_text(self, opus_data, session_id, audio_format):
        result = self.text
        self.text = ""  # 清空text
        return result, None

    async def close(self):
        """资源清理方法"""
        if self.asr_ws:
            await self.asr_ws.close()
            self.asr_ws = None
        if self.forward_task:
            self.forward_task.cancel()
            try:
                await self.forward_task
            except asyncio.CancelledError:
                pass
            self.forward_task = None
        self.is_processing = False

        # 显式释放decoder资源
        if hasattr(self, 'decoder') and self.decoder is not None:
            try:
                del self.decoder
                self.decoder = None
                logger.bind(tag=TAG).debug("Doubao decoder resources released")
            except Exception as e:
                logger.bind(tag=TAG).debug(f"释放Doubao decoder资源时出错: {e}")

        # 清理所有连接的音频缓冲区
        if hasattr(self, '_connections'):
            for conn in self._connections.values():
                if hasattr(conn, 'asr_audio_for_voiceprint'):
                    conn.asr_audio_for_voiceprint = []
                if hasattr(conn, 'asr_audio'):
                    conn.asr_audio = []
