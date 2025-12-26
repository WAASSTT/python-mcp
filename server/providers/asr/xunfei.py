"""Xunfei Stream ASR Provider"""
import asyncio
import base64
import hashlib
import hmac
import json
import time
from typing import AsyncIterator
from urllib.parse import urlencode
import websockets
from . import ASRProvider
from server.config.logger import create_logger


logger = create_logger("XunfeiStreamASR")


class XunfeiStreamASR(ASRProvider):
    """Xunfei streaming ASR provider"""

    def __init__(self, config: dict):
        self.app_id = config.get('app_id')
        self.access_key_id = config.get('access_key_id')
        self.access_key_secret = config.get('access_key_secret')
        self.api_url = config.get('api_url', 'wss://office-api-ast-dx.iflyaisol.com/ast/communicate/v1')
        self.lang = config.get('lang', 'autodialect')
        self.audio_encode = config.get('audio_encode', 'pcm_s16le')
        self.samplerate = config.get('samplerate', 16000)
        self.role_type = config.get('role_type', 0)
        self.output_dir = config.get('output_dir', 'tmp/asr')

    def _generate_signature(self) -> str:
        """Generate HMAC-SHA1 signature for authentication"""
        timestamp = str(int(time.time()))

        # Create signature base string
        base_string = f"{self.app_id}{timestamp}"

        # Generate HMAC-SHA1 signature
        signature = hmac.new(
            self.access_key_secret.encode('utf-8'),
            base_string.encode('utf-8'),
            hashlib.sha1
        ).digest()

        # Base64 encode
        signature_b64 = base64.b64encode(signature).decode('utf-8')

        return signature_b64

    def _build_auth_url(self) -> str:
        """Build authenticated WebSocket URL"""
        timestamp = str(int(time.time()))
        signature = self._generate_signature()

        params = {
            'appid': self.app_id,
            'ts': timestamp,
            'signa': signature
        }

        return f"{self.api_url}?{urlencode(params)}"

    async def transcribe_stream(
        self,
        audio_stream: AsyncIterator[bytes]
    ) -> AsyncIterator[str]:
        """Transcribe audio stream to text using WebSocket"""
        url = self._build_auth_url()

        try:
            async with websockets.connect(url) as ws:
                logger.info("Connected to Xunfei ASR WebSocket")

                # Send configuration
                config_msg = {
                    "type": "config",
                    "data": {
                        "lang": self.lang,
                        "audioEncode": self.audio_encode,
                        "sampleRate": self.samplerate,
                        "roleType": self.role_type
                    }
                }
                await ws.send(json.dumps(config_msg))

                # Start audio streaming task
                async def send_audio():
                    try:
                        async for audio_chunk in audio_stream:
                            # Send audio data
                            audio_msg = {
                                "type": "audio",
                                "data": base64.b64encode(audio_chunk).decode('utf-8')
                            }
                            await ws.send(json.dumps(audio_msg))

                        # Send end signal
                        end_msg = {"type": "end"}
                        await ws.send(json.dumps(end_msg))
                    except Exception as e:
                        logger.error(f"Error sending audio: {e}")

                # Start sending task
                send_task = asyncio.create_task(send_audio())

                # Receive transcription results
                try:
                    async for message in ws:
                        data = json.loads(message)

                        if data.get('type') == 'result':
                            text = data.get('data', {}).get('text', '')
                            if text:
                                yield text
                        elif data.get('type') == 'error':
                            error = data.get('data', {})
                            logger.error(f"ASR error: {error}")
                            break
                        elif data.get('type') == 'end':
                            logger.info("ASR stream ended")
                            break

                except Exception as e:
                    logger.error(f"Error receiving transcription: {e}")
                finally:
                    send_task.cancel()

        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            raise

    async def transcribe(self, audio_data: bytes) -> str:
        """Transcribe complete audio data to text"""
        async def audio_generator():
            yield audio_data

        result = []
        async for text in self.transcribe_stream(audio_generator()):
            result.append(text)

        return ''.join(result)

    async def speech_to_text(
        self,
        audio_data: list[bytes],
        session_id: str,
        audio_format: str = "opus"
    ) -> tuple[str | None, str | None]:
        """Convert speech audio to text

        Args:
            audio_data: List of audio chunks
            session_id: Unique session identifier
            audio_format: Audio format (default: "opus")

        Returns:
            Tuple of (recognized_text, file_path if saved)
        """
        try:
            # Combine all audio chunks
            combined_audio = b''.join(audio_data)

            # Transcribe audio
            text = await self.transcribe(combined_audio)

            return (text, None)
        except Exception as e:
            logger.error(f"Speech to text error: {e}")
            return (None, None)
