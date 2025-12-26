"""ASR (Automatic Speech Recognition) provider"""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple


class ASRProvider(ABC):
    """Base class for Automatic Speech Recognition providers"""

    @abstractmethod
    async def speech_to_text(
        self,
        audio_data: List[bytes],
        session_id: str,
        audio_format: str = "opus"
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Convert speech audio to text

        Args:
            audio_data: List of audio chunks (Opus encoded)
            session_id: Unique session identifier
            audio_format: Audio format (default: "opus")

        Returns:
            Tuple of (recognized_text, file_path if saved)
        """
        pass

    async def close(self) -> None:
        """Clean up resources"""
        pass


def create_asr_provider(provider_name: str, config: dict) -> ASRProvider:
    """Factory function to create ASR provider

    Args:
        provider_name: Name of the provider (e.g., 'xunfei')
        config: Provider configuration

    Returns:
        ASR provider instance
    """
    if provider_name == "xunfei":
        from .xunfei import XunfeiStreamASR
        return XunfeiStreamASR(config)
    else:
        raise ValueError(f"Unknown ASR provider: {provider_name}")


__all__ = ["ASRProvider", "create_asr_provider"]
