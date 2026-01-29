/**
 * Providers 统一导出
 *
 * 提供对各类服务提供者的统一访问接口
 */

// ASR Providers
export * from "@/providers/asr";
export * from "@/providers/asr/base";
export * from "@/providers/asr/doubao_stream";

// LLM Providers
export * from "@/providers/llm";
export * from "@/providers/llm/base";
export * from "@/providers/llm/openai";

// TTS Providers
export * from "@/providers/tts";
export * from "@/providers/tts/base";
export * from "@/providers/tts/huoshan_stream";

// VAD Providers
export * from "@/providers/vad";
export * from "@/providers/vad/base";
export * from "@/providers/vad/silero";

// vLLM Providers
export * from "@/providers/vllm";
export * from "@/providers/vllm/base";
export * from "@/providers/vllm/openai";

// Intent Providers
export * from "@/providers/intent";
export * from "@/providers/intent/base";

// Memory Providers
export * from "@/providers/memory";
export * from "@/providers/memory/base";
export * from "@/providers/memory/mem0ai/mem0ai";
export * from "@/providers/memory/mem_local_short/mem_local_short";
export * from "@/providers/memory/nomem/nomem";

/**
 * Provider 工厂函数
 */
import { createVADProvider } from "@/providers/vad";

export interface ProviderFactories {
  createVAD: typeof createVADProvider;
}

export const providers: ProviderFactories = {
  createVAD: createVADProvider,
};

/**
 * 类型导出
 */
export type {
  ASRConfig,
  // ASR
  ASRProvider,
  ASRResult,
} from "@/providers/asr/base";

export type {
  LLMConfig,
  // LLM
  LLMProvider,
  LLMResponse,
} from "@/providers/llm/base";

export type {
  TTSConfig,
  // TTS
  TTSProvider,
  TTSResult,
} from "@/providers/tts/base";

export type {
  VADConfig,
  // VAD
  VADProvider,
  VADResult,
} from "@/providers/vad/base";

export type {
  VLLMConfig,
  // vLLM
  VLLMProvider,
  VLLMResponse,
} from "@/providers/vllm/base";

export type {
  IntentConfig,
  // Intent
  IntentProvider,
  IntentResult,
} from "@/providers/intent/base";

export type {
  MemoryConfig,
  // Memory
  MemoryProvider,
  MemorySearchResult,
} from "@/providers/memory/base";
