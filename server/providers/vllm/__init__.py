"""VLLM (Vision Language Model) provider base"""
from abc import ABC, abstractmethod
from typing import List, Dict


class VLLMProvider(ABC):
    """Base class for VLLM providers"""

    @abstractmethod
    async def analyze_image(
        self,
        image_url: str,
        prompt: str = "描述这张图片",
        **kwargs
    ) -> str:
        """Analyze image with vision model

        Args:
            image_url: URL or base64 of the image
            prompt: Text prompt for analysis
            **kwargs: Additional parameters

        Returns:
            Analysis result text
        """
        pass


def create_vllm_provider(provider_name: str, config: dict) -> VLLMProvider:
    """Factory function to create VLLM provider

    Args:
        provider_name: Name of the provider (e.g., 'qwen_vl')
        config: Provider configuration

    Returns:
        VLLM provider instance
    """
    if provider_name == "qwen_vl":
        from .qwen_vl import QwenVL
        return QwenVL(config)
    else:
        raise ValueError(f"Unknown VLLM provider: {provider_name}")


__all__ = ["VLLMProvider", "create_vllm_provider"]
