"""Qwen LLM Provider (Alibaba Cloud)"""
from collections.abc import AsyncGenerator
from typing import List, Dict
from openai import AsyncOpenAI
from . import LLMProvider
from server.config.logger import create_logger


logger = create_logger("QwenLLM")


class QwenLLM(LLMProvider):
    """Qwen LLM provider using OpenAI-compatible API"""

    def __init__(self, config: dict):
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', 'https://dashscope.aliyuncs.com/compatible-mode/v1')
        self.model = config.get('model', 'qwen-plus')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 2000)
        self.top_p = config.get('top_p', 0.8)
        self.enable_search = config.get('enable_search', False)

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    async def chat_stream(
        self,
        text: str,
        history: list[dict[str, str]] | None = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion"""
        try:
            # Build messages from history and current text
            messages = history.copy() if history else []
            messages.append({"role": "user", "content": text})

            # Merge config with kwargs
            params = {
                'model': kwargs.get('model', self.model),
                'messages': messages,
                'temperature': kwargs.get('temperature', self.temperature),
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'top_p': kwargs.get('top_p', self.top_p),
                'stream': True
            }

            if self.enable_search:
                params['enable_search'] = True

            logger.info(f"Starting chat stream with model: {params['model']}")

            response = await self.client.chat.completions.create(**params)

            async for chunk in response:
                if chunk.choices and len(chunk.choices) > 0:
                    delta = chunk.choices[0].delta
                    if delta.content:
                        yield delta.content

        except Exception as e:
            logger.error(f"Error in chat stream: {e}")
            raise
