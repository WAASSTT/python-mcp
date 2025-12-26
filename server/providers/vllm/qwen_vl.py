"""Qwen-VL Vision Language Model Provider"""
from typing import List, Dict
from openai import AsyncOpenAI
from . import VLLMProvider
from server.config.logger import create_logger


logger = create_logger("QwenVL")


class QwenVL(VLLMProvider):
    """Qwen-VL provider using OpenAI-compatible API"""

    def __init__(self, config: dict):
        self.api_key = config.get('api_key')
        self.base_url = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        self.model = config.get('model', 'qwen-vl-max')
        self.temperature = config.get('temperature', 0.7)
        self.max_tokens = config.get('max_tokens', 1500)

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    async def analyze_image(
        self,
        image_url: str,
        prompt: str = "描述这张图片",
        **kwargs
    ) -> str:
        """Analyze image with Qwen-VL"""
        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}}
                    ]
                }
            ]

            params = {
                'model': kwargs.get('model', self.model),
                'messages': messages,
                'temperature': kwargs.get('temperature', self.temperature),
                'max_tokens': kwargs.get('max_tokens', self.max_tokens)
            }

            logger.info(f"Analyzing image with model: {params['model']}")

            response = await self.client.chat.completions.create(**params)

            if response.choices and len(response.choices) > 0:
                result = response.choices[0].message.content
                logger.info(f"Image analysis completed: {len(result)} chars")
                return result
            else:
                return ""

        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            raise
