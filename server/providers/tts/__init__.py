"""TTS (Text-to-Speech) provider"""
from abc import ABC, abstractmethod
from typing import Optional


class TTSProvider(ABC):
    """Base class for Text-to-Speech providers"""

    @abstractmethod
    async def text_to_speech(
        self,
        text: str,
        output_file: Optional[str] = None
    ) -> bytes:
        """
        Convert text to speech audio

        Args:
            text: Text to synthesize
            output_file: Optional file path to save audio

        Returns:
            Audio data (Opus encoded bytes)
        """
        pass

    async def close(self) -> None:
        """Clean up resources"""
        pass


def create_tts_provider(provider_name: str, config: dict) -> TTSProvider:
    """Factory function to create TTS provider

    Args:
        provider_name: Name of the provider (e.g., 'huoshan')
        config: Provider configuration

    Returns:
        TTS provider instance
    """
    if provider_name == "huoshan":
        from .huoshan import HuoshanStreamTTS
        return HuoshanStreamTTS(config)
    else:
        raise ValueError(f"Unknown TTS provider: {provider_name}")


__all__ = ["TTSProvider", "create_tts_provider"]
