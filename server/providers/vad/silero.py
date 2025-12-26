"""Silero VAD Provider implementation"""
import time
import numpy as np
import torch
from typing import TYPE_CHECKING, Any

try:
    import opuslib_next
    OPUS_AVAILABLE = True
except ImportError:
    OPUS_AVAILABLE = False
    print("Warning: opuslib_next not available. Install with: pip install opuslib-next")

from server.providers.vad import VADProvider as VADProviderBase
from server.config.logger import create_logger

if TYPE_CHECKING:
    from server.types import ConnectionState

logger = create_logger("SileroVAD")


class VADProvider(VADProviderBase):
    """Silero VAD provider for voice activity detection"""

    model: Any  # Silero VAD model
    decoder: Any  # Opus decoder

    def __init__(self, config: dict):
        """Initialize Silero VAD"""
        logger.info(f"Initializing SileroVAD with config: {config}")

        # Load model
        model_dir = config.get("model_dir")
        if model_dir:
            model_result = torch.hub.load(  # type: ignore
                repo_or_dir=model_dir,
                source="local",
                model="silero_vad",
                force_reload=False
            )
            self.model = model_result[0] if isinstance(model_result, tuple) else model_result
        else:
            model_result = torch.hub.load(  # type: ignore
                repo_or_dir="snakers4/silero-vad",
                model="silero_vad",
                force_reload=False,
                onnx=False
            )
            self.model = model_result[0] if isinstance(model_result, tuple) else model_result

        # Initialize Opus decoder
        self.decoder = None
        if OPUS_AVAILABLE:
            import opuslib_next  # noqa: F401
            self.decoder = opuslib_next.Decoder(16000, 1)
        else:
            logger.warning("opuslib_next not available - audio processing will fail")

        # Parse config
        threshold = config.get("threshold", "0.5")
        threshold_low = config.get("threshold_low", "0.2")
        min_silence_duration_ms = config.get("min_silence_duration_ms", "1000")

        self.vad_threshold = float(threshold) if threshold else 0.5
        self.vad_threshold_low = float(threshold_low) if threshold_low else 0.2
        self.silence_threshold_ms = int(min_silence_duration_ms) if min_silence_duration_ms else 1000
        self.frame_window_threshold = 3

        logger.info(f"SileroVAD initialized: threshold={self.vad_threshold}")

    def __del__(self):
        if hasattr(self, 'decoder') and self.decoder is not None:
            try:
                del self.decoder
            except Exception:
                pass

    def is_vad(self, conn: 'ConnectionState', audio_data: bytes) -> bool:
        """Detect voice activity from raw Opus packets"""
        if conn.listen_mode == "manual":
            return True

        if not OPUS_AVAILABLE or not self.decoder:
            logger.warning("Opus decoder not available")
            return False

        try:
            # Decode Opus packet (60ms frame = 960 samples @ 16kHz)
            pcm_frame = self.decoder.decode(audio_data, 960)
            conn.audio_buffer.extend(pcm_frame)

            have_voice = False
            while len(conn.audio_buffer) >= 512 * 2:
                chunk = conn.audio_buffer[:512 * 2]
                conn.audio_buffer = conn.audio_buffer[512 * 2:]

                audio_int16 = np.frombuffer(chunk, dtype=np.int16)
                audio_float32 = audio_int16.astype(np.float32) / 32768.0
                audio_tensor = torch.from_numpy(audio_float32)

                with torch.no_grad():
                    speech_prob = self.model(audio_tensor, 16000).item()  # type: ignore

                if speech_prob >= self.vad_threshold:
                    is_voice = True
                elif speech_prob <= self.vad_threshold_low:
                    is_voice = False
                else:
                    is_voice = conn.last_is_voice

                conn.last_is_voice = is_voice
                conn.voice_window.append(is_voice)

                have_voice = conn.voice_window.count(True) >= self.frame_window_threshold

                if conn.have_voice and not have_voice:
                    stop_duration = time.time() * 1000 - conn.last_activity_time
                    if stop_duration >= self.silence_threshold_ms:
                        conn.voice_stop = True

                if have_voice:
                    conn.have_voice = True
                    conn.last_activity_time = time.time() * 1000

            return have_voice

        except Exception as e:
            logger.error(f"Error processing audio: {e}")
            return False

    def reset_states(self, conn: 'ConnectionState') -> None:
        """Reset VAD states"""
        conn.reset_vad_states()
        conn.audio_buffer.clear()
