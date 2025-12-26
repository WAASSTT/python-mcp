"""Huoshan (Volcano Engine) Stream TTS Provider"""
import json
import uuid
import websockets
from typing import AsyncIterator
from . import TTSProvider
from server.config.logger import create_logger


logger = create_logger("HuoshanStreamTTS")


class HuoshanStreamTTS(TTSProvider):
    """Huoshan streaming TTS provider"""

    def __init__(self, config: dict):
        self.appid = config.get('appid')
        self.access_token = config.get('access_token')
        self.resource_id = config.get('resource_id')
        self.cluster = config.get('cluster', 'volcano_tts')
        self.ws_url = config.get('ws_url', 'wss://openspeech.bytedance.com/api/v1/tts/ws_binary')
        self.speaker = config.get('speaker', 'zh_female_qingxin')
        self.speech_rate = config.get('speech_rate', 1.0)
        self.loudness_rate = config.get('loudness_rate', 1.0)
        self.pitch = config.get('pitch', 1.0)
        self.sample_rate = config.get('sample_rate', 24000)
        self.audio_format = config.get('audio_format', 'pcm')
        self.output_dir = config.get('output_dir', 'tmp/tts')

    def _build_request(self, text: str, request_id: str) -> dict:
        """Build TTS request"""
        return {
            "app": {
                "appid": self.appid,
                "token": self.access_token,
                "cluster": self.cluster
            },
            "user": {
                "uid": "user_001"
            },
            "audio": {
                "voice_type": self.speaker,
                "encoding": self.audio_format,
                "speed_ratio": self.speech_rate,
                "volume_ratio": self.loudness_rate,
                "pitch_ratio": self.pitch,
                "rate": self.sample_rate
            },
            "request": {
                "reqid": request_id,
                "text": text,
                "text_type": "plain",
                "operation": "submit"
            },
            "resource_id": self.resource_id
        }

    async def synthesize_stream(
        self,
        text: str,
        **kwargs
    ) -> AsyncIterator[bytes]:
        """Synthesize speech in streaming mode"""
        request_id = str(uuid.uuid4())

        try:
            async with websockets.connect(self.ws_url) as ws:
                logger.info(f"Connected to Huoshan TTS WebSocket, request_id: {request_id}")

                # Send synthesis request
                request_data = self._build_request(text, request_id)
                await ws.send(json.dumps(request_data))

                # Receive audio stream
                async for message in ws:
                    if isinstance(message, bytes):
                        # Binary audio data
                        yield message
                    else:
                        # JSON response
                        try:
                            data = json.loads(message)
                            if data.get('code') != 0:
                                error_msg = data.get('message', 'Unknown error')
                                logger.error(f"TTS error: {error_msg}")
                                break

                            # Check if synthesis is complete
                            if data.get('operation') == 'finish':
                                logger.info(f"TTS synthesis completed: {request_id}")
                                break

                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse JSON response: {message}")

        except Exception as e:
            logger.error(f"WebSocket connection error: {e}")
            raise

    async def synthesize(
        self,
        text: str,
        **kwargs
    ) -> bytes:
        """Synthesize complete speech"""
        audio_chunks = []

        async for chunk in self.synthesize_stream(text, **kwargs):
            audio_chunks.append(chunk)

        return b''.join(audio_chunks)

    async def text_to_speech(
        self,
        text: str,
        output_file: str | None = None
    ) -> bytes:
        """Convert text to speech audio

        Args:
            text: Text to synthesize
            output_file: Optional file path to save audio

        Returns:
            Audio data bytes
        """
        try:
            audio_data = await self.synthesize(text)

            # Save to file if specified
            if output_file:
                with open(output_file, 'wb') as f:
                    f.write(audio_data)
                logger.info(f"Audio saved to: {output_file}")

            return audio_data
        except Exception as e:
            logger.error(f"Text to speech error: {e}")
            raise
