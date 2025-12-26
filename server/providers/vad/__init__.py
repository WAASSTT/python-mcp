"""VAD (Voice Activity Detection) provider"""
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from server.types import ConnectionState


class VADProvider(ABC):
    """Base class for Voice Activity Detection providers"""

    @abstractmethod
    def is_vad(self, conn: 'ConnectionState', audio_data: bytes) -> bool:
        """
        Detect voice activity in audio data

        Args:
            conn: Connection state object
            audio_data: Audio data (Opus encoded)

        Returns:
            True if voice detected, False otherwise
        """
        pass

    def reset_states(self, conn: 'ConnectionState') -> None:
        """
        Reset VAD states for a connection

        Args:
            conn: Connection state object
        """
        pass


def create_vad_provider(provider_name: str, config: dict) -> VADProvider:
    """Factory function to create VAD provider

    Args:
        provider_name: Name of the provider (e.g., 'silero')
        config: Provider configuration

    Returns:
        VAD provider instance
    """
    if provider_name == "silero":
        from .silero import VADProvider as SileroVAD
        return SileroVAD(config)
    else:
        raise ValueError(f"Unknown VAD provider: {provider_name}")


__all__ = ["VADProvider", "create_vad_provider"]
