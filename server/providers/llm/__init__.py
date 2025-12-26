"""LLM (Large Language Model) provider"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any, Optional


class LLMProvider(ABC):
    """Base class for Large Language Model providers"""

    @abstractmethod
    async def chat_stream(
        self,
        text: str,
        history: Optional[List[Dict[str, str]]] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion"""
        pass
        # Needed for mypy
        if False:
            yield ""

    async def chat(
        self,
        text: str,
        history: Optional[List[Dict[str, str]]] = None,
        **kwargs
    ) -> str:
        """Non-streaming chat completion"""
        chunks = []
        async for chunk in self.chat_stream(text, history, **kwargs):
            chunks.append(chunk)
        return ''.join(chunks)


def create_llm_provider(provider_name: str, config: dict) -> LLMProvider:
    """Factory function to create LLM provider

    Args:
        provider_name: Name of the provider (e.g., 'qwen')
        config: Provider configuration

    Returns:
        LLM provider instance
    """
    if provider_name == "qwen":
        from .qwen import QwenLLM
        return QwenLLM(config)
    else:
        raise ValueError(f"Unknown LLM provider: {provider_name}")


__all__ = ["LLMProvider", "create_llm_provider"]
