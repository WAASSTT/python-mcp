"""WebSocket server implementation with audio processing"""
import json
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect

from server.types import DeviceInfo, SessionInfo, Message, Config, ConnectionState
from server.config.logger import create_logger

logger = create_logger("WebSocketServer")


class ConnectionManager:
    """Manages WebSocket connections and their states"""

    def __init__(self):
        self.devices: Dict[str, DeviceInfo] = {}
        self.sessions: Dict[str, SessionInfo] = {}
        self.connections: Dict[str, ConnectionState] = {}

    def add_device(self, client_id: str, device_info: Optional[Dict] = None) -> None:
        """Add a new device connection"""
        device = DeviceInfo(
            client_id=client_id,
            mac_address=device_info.get('macAddress') if device_info else None,
            device_model=device_info.get('deviceModel') if device_info else None,
            connected_at=datetime.now(),
            last_activity=datetime.now()
        )
        self.devices[client_id] = device
        logger.info(f"Device connected: {client_id}, Total: {len(self.devices)}")

    def remove_device(self, client_id: str) -> None:
        """Remove a device connection"""
        if client_id in self.devices:
            del self.devices[client_id]
        if client_id in self.connections:
            del self.connections[client_id]
        logger.info(f"Device disconnected: {client_id}, Remaining: {len(self.devices)}")

    def get_device(self, client_id: str) -> Optional[DeviceInfo]:
        """Get device information"""
        return self.devices.get(client_id)

    def update_activity(self, client_id: str) -> None:
        """Update last activity time"""
        device = self.devices.get(client_id)
        if device:
            device.last_activity = datetime.now()

    def get_all_devices(self) -> list[DeviceInfo]:
        """Get all connected devices"""
        return list(self.devices.values())

    def create_session(self, device_id: str) -> str:
        """Create a new session"""
        session_id = str(uuid.uuid4())
        session = SessionInfo(
            session_id=session_id,
            device_id=device_id,
            start_time=datetime.now(),
            messages=[]
        )
        self.sessions[session_id] = session
        return session_id

    def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """Get session information"""
        return self.sessions.get(session_id)

    def add_message_to_session(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> None:
        """Add a message to session"""
        session = self.sessions.get(session_id)
        if session:
            # Validate role
            if role not in ('user', 'assistant', 'system'):
                role = 'user'
            message = Message(
                role=role,
                content=content,
                timestamp=datetime.now()
            )
            session.messages.append(message)

    def get_connection(self, client_id: str) -> Optional[ConnectionState]:
        """Get connection state"""
        return self.connections.get(client_id)

    def create_connection(self, client_id: str, websocket: WebSocket, config: Config) -> ConnectionState:
        """Create a new connection state"""
        conn = ConnectionState(
            client_id=client_id,
            websocket=websocket,
            session_id=str(uuid.uuid4())
        )

        # Initialize providers if available
        try:
            # Initialize VAD
            vad_name = config.selected_module.VAD
            if vad_name and vad_name in config.VAD:
                from server.providers.vad.silero import VADProvider as SileroVAD
                conn.vad = SileroVAD(config.VAD[vad_name])
                logger.info(f"VAD initialized: {vad_name}")
        except Exception as e:
            logger.warning(f"Failed to initialize VAD: {e}")

        self.connections[client_id] = conn
        return conn

    async def connect(self, client_id: str, websocket: WebSocket, config: Config) -> None:
        """Accept WebSocket connection"""
        await websocket.accept()

        # Create connection state
        conn = self.create_connection(client_id, websocket, config)

        # Add device
        self.add_device(client_id)

        # Send hello message
        await self.send_message(client_id, {
            'type': 'hello',
            'session_id': conn.session_id,
            'status': 'connected',
            'message': '连接成功'
        })

    def disconnect(self, client_id: str) -> None:
        """Handle disconnection"""
        self.remove_device(client_id)

    async def send_message(self, client_id: str, message: dict) -> bool:
        """Send JSON message"""
        conn = self.connections.get(client_id)
        if not conn or not conn.websocket:
            logger.warning(f"Cannot send message to [{client_id}]: no connection")
            return False

        try:
            await conn.websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to [{client_id}]: {e}")
            self.remove_device(client_id)
            return False

    async def send_bytes(self, client_id: str, data: bytes) -> bool:
        """Send binary data"""
        conn = self.connections.get(client_id)
        if not conn or not conn.websocket:
            logger.warning(f"Cannot send bytes to [{client_id}]: no connection")
            return False

        try:
            await conn.websocket.send_bytes(data)
            return True
        except Exception as e:
            logger.error(f"Error sending bytes to [{client_id}]: {e}")
            self.remove_device(client_id)
            return False


# Global connection manager
connection_manager = ConnectionManager()


async def handle_audio_message(client_id: str, audio_data: bytes, config: Config) -> None:
    """Handle incoming audio data"""
    conn = connection_manager.get_connection(client_id)
    if not conn:
        logger.warning(f"No connection state for [{client_id}]")
        return

    # VAD detection
    if conn.vad:
        have_voice = conn.vad.is_vad(conn, audio_data)

        # Cache audio for ASR
        conn.asr_audio.append(audio_data)

        # Detect voice stop - trigger ASR
        if conn.voice_stop:
            audio_for_asr = conn.asr_audio.copy()
            conn.asr_audio.clear()
            conn.voice_stop = False
            conn.reset_vad_states()

            # Process ASR in background
            if len(audio_for_asr) > 10:  # Minimum audio length
                asyncio.create_task(process_asr(client_id, audio_for_asr, config))
    else:
        logger.debug("VAD not initialized, audio data ignored")


async def process_asr(client_id: str, audio_data: list, config: Config) -> None:
    """Process speech recognition"""
    conn = connection_manager.get_connection(client_id)
    if not conn:
        return

    try:
        # Initialize ASR provider if not already done
        if not conn.asr:
            asr_name = config.selected_module.ASR
            if asr_name and asr_name in config.ASR:
                from server.providers.asr.xunfei import XunfeiStreamASR
                conn.asr = XunfeiStreamASR(config.ASR[asr_name])
                logger.info(f"ASR initialized: {asr_name}")
            else:
                logger.error(f"ASR provider not configured: {asr_name}")
                return

        logger.info(f"[{client_id}] Processing ASR with {len(audio_data)} audio chunks")

        # Call ASR
        text, file_path = await conn.asr.speech_to_text(
            audio_data,
            conn.session_id or client_id,
            audio_format="opus"
        )

        if not text:
            logger.warning(f"[{client_id}] ASR returned empty text")
            return

        logger.info(f"[{client_id}] ASR result: {text}")

        # Send STT message
        await connection_manager.send_message(client_id, {
            'type': 'stt',
            'text': text,
            'session_id': conn.session_id
        })

        # Add to chat history
        conn.add_message("user", text)

        # Process LLM
        await process_llm(client_id, text, config)

    except Exception as e:
        logger.error(f"ASR error for [{client_id}]: {e}")


async def process_llm(client_id: str, text: str, config: Config) -> None:
    """Process LLM chat"""
    conn = connection_manager.get_connection(client_id)
    if not conn:
        return

    try:
        # Initialize LLM provider if not already done
        if not conn.llm:
            llm_name = config.selected_module.LLM
            if llm_name and llm_name in config.LLM:
                from server.providers.llm.qwen import QwenLLM
                conn.llm = QwenLLM(config.LLM[llm_name])
                logger.info(f"LLM initialized: {llm_name}")
            else:
                logger.error(f"LLM provider not configured: {llm_name}")
                return

        # Initialize TTS provider if not already done
        if not conn.tts:
            tts_name = config.selected_module.TTS
            if tts_name and tts_name in config.TTS:
                from server.providers.tts.huoshan import HuoshanStreamTTS
                conn.tts = HuoshanStreamTTS(config.TTS[tts_name])
                logger.info(f"TTS initialized: {tts_name}")
            else:
                logger.error(f"TTS provider not configured: {tts_name}")
                return

        # Send TTS start
        await connection_manager.send_message(client_id, {
            'type': 'tts',
            'state': 'start',
            'session_id': conn.session_id
        })

        logger.info(f"[{client_id}] Processing LLM for: {text}")

        # Get chat history
        history = conn.chat_history.copy() if conn.chat_history else []

        # Stream LLM response
        full_response = ""
        current_sentence = ""

        async for chunk in conn.llm.chat_stream(text, history):
            full_response += chunk
            current_sentence += chunk

            # Check for sentence end (。！？\n)
            if chunk in ('。', '！', '？', '\n'):
                sentence = current_sentence.strip()
                if sentence:
                    logger.debug(f"[{client_id}] LLM sentence: {sentence}")

                    # Send sentence start
                    await connection_manager.send_message(client_id, {
                        'type': 'tts',
                        'state': 'sentence_start',
                        'text': sentence,
                        'session_id': conn.session_id
                    })

                    # Generate and send TTS audio
                    audio_data = await conn.tts.text_to_speech(sentence)
                    if audio_data:
                        await connection_manager.send_bytes(client_id, audio_data)

                    # Send sentence end
                    await connection_manager.send_message(client_id, {
                        'type': 'tts',
                        'state': 'sentence_end',
                        'session_id': conn.session_id
                    })

                    current_sentence = ""

        # Handle remaining text
        if current_sentence.strip():
            sentence = current_sentence.strip()
            logger.debug(f"[{client_id}] LLM final sentence: {sentence}")

            await connection_manager.send_message(client_id, {
                'type': 'tts',
                'state': 'sentence_start',
                'text': sentence,
                'session_id': conn.session_id
            })

            audio_data = await conn.tts.text_to_speech(sentence)
            if audio_data:
                await connection_manager.send_bytes(client_id, audio_data)

            await connection_manager.send_message(client_id, {
                'type': 'tts',
                'state': 'sentence_end',
                'session_id': conn.session_id
            })

        logger.info(f"[{client_id}] LLM complete response: {full_response}")

        # Add to chat history
        conn.add_message("assistant", full_response)

        # Send TTS stop
        await connection_manager.send_message(client_id, {
            'type': 'tts',
            'state': 'stop',
            'session_id': conn.session_id
        })

    except Exception as e:
        logger.error(f"LLM error for [{client_id}]: {e}")


async def handle_text_message(client_id: str, data: dict, config: Config) -> None:
    """Handle text messages"""
    text = data.get('text') or data.get('data', {}).get('text', '')
    session_id = data.get('session_id', '')

    logger.info(f"Text from [{client_id}]: {text}")

    conn = connection_manager.get_connection(client_id)
    if conn:
        conn.add_message("user", text)
        await process_llm(client_id, text, config)


async def handle_control_message(client_id: str, data: dict) -> None:
    """Handle control commands"""
    command = data.get('data', {}).get('command')

    if command == 'ping':
        await connection_manager.send_message(client_id, {
            'type': 'control',
            'data': {'command': 'pong'}
        })
    else:
        logger.debug(f"Control command from [{client_id}]: {command}")


async def handle_websocket_message(
    client_id: str,
    message: Any,
    config: Config
) -> None:
    """Handle incoming WebSocket messages"""
    try:
        connection_manager.update_activity(client_id)

        # Handle binary audio data
        if isinstance(message, bytes):
            logger.debug(f"Audio from [{client_id}]: {len(message)} bytes")
            await handle_audio_message(client_id, message, config)
            return

        # Handle JSON messages
        if isinstance(message, str):
            try:
                data = json.loads(message)
                msg_type = data.get('type')

                if msg_type == 'config':
                    device_info = data.get('deviceInfo', {})
                    connection_manager.add_device(client_id, device_info)

                elif msg_type == 'text':
                    await handle_text_message(client_id, data, config)

                elif msg_type == 'control':
                    await handle_control_message(client_id, data)

                elif msg_type == 'hello':
                    logger.info(f"Hello from [{client_id}]")

                elif msg_type == 'audio':
                    logger.info(f"Audio control from [{client_id}]: {data}")

                else:
                    logger.warning(f"Unknown message type from [{client_id}]: {msg_type}")

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON from [{client_id}]: {message}")

    except Exception as e:
        logger.error(f"Error handling message from [{client_id}]: {e}")
        await connection_manager.send_message(client_id, {
            'type': 'error',
            'data': {'error': str(e)}
        })


async def websocket_endpoint(websocket: WebSocket, config: Config):
    """WebSocket endpoint handler"""
    client_id = (websocket.headers.get("client-id") or
                 websocket.query_params.get("client-id") or
                 str(uuid.uuid4()))
    device_id = (websocket.headers.get("device-id") or
                 websocket.query_params.get("device-id"))

    logger.info(f"New connection: client_id={client_id}, device_id={device_id}")

    if not device_id:
        try:
            await websocket.accept()
            await websocket.send_json({
                'type': 'error',
                'data': {'error': '缺少 device-id 参数'}
            })
            await websocket.close(code=1008, reason="Missing device-id")
        except Exception as e:
            logger.error(f"Error closing connection: {e}")
        return

    try:
        await connection_manager.connect(client_id, websocket, config)
    except Exception as e:
        logger.error(f"Error accepting connection from [{client_id}]: {e}")
        return

    try:
        while True:
            try:
                # 检查连接状态
                if websocket.client_state.name != "CONNECTED":
                    logger.info(f"Client [{client_id}] connection state changed: {websocket.client_state.name}")
                    break

                data = await websocket.receive()

                if 'text' in data:
                    await handle_websocket_message(client_id, data['text'], config)
                elif 'bytes' in data:
                    await handle_websocket_message(client_id, data['bytes'], config)

            except WebSocketDisconnect:
                logger.info(f"Client [{client_id}] disconnected normally")
                break
            except RuntimeError as e:
                # 捕获 "Cannot call receive once a disconnect message has been received" 错误
                if "disconnect message" in str(e):
                    logger.info(f"Client [{client_id}] disconnect message received")
                else:
                    logger.error(f"Runtime error for [{client_id}]: {e}")
                break
            except Exception as e:
                logger.error(f"Error receiving message from [{client_id}]: {e}")
                break

    except Exception as e:
        logger.error(f"Unexpected error for [{client_id}]: {e}")
    finally:
        connection_manager.disconnect(client_id)
        logger.info(f"Connection cleanup completed for [{client_id}]")
