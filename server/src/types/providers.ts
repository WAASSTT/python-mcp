export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  name?: string;
}

export interface ChatOptions {
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface BaseLLMProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<string | AsyncIterableIterator<string>>;
  chatStream(messages: Message[], options?: ChatOptions): AsyncIterableIterator<string>;
}

export interface TranscribeOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
}

export interface BaseASRProvider {
  transcribe(audio: Buffer | Blob, options?: TranscribeOptions): Promise<string>;
  transcribeStream?(audioStream: AsyncIterableIterator<Buffer>): AsyncIterableIterator<string>;
}

export interface SynthesizeOptions {
  voice?: string;
  speed?: number;
  format?: "mp3" | "opus" | "pcm";
}

export interface BaseTTSProvider {
  synthesize(text: string, options?: SynthesizeOptions): Promise<Buffer>;
  synthesizeStream(text: string, options?: SynthesizeOptions): AsyncIterableIterator<Buffer>;
}

export interface VisionOptions {
  max_tokens?: number;
  detail?: "low" | "high" | "auto";
  language?: string;
  temperature?: number;
  top_p?: number;
}

export interface BaseVLLMProvider {
  analyze(image: string | Buffer, prompt: string, options?: VisionOptions): Promise<string>;
  analyzeStream?(
    image: string | Buffer,
    prompt: string,
    options?: VisionOptions,
  ): AsyncIterableIterator<string>;
}

export interface Intent {
  intent: string;
  confidence: number;
  entities?: Record<string, any>;
}

export interface BaseIntentProvider {
  recognize(text: string): Promise<Intent>;
  batchRecognize?(texts: string[]): Promise<Intent[]>;
}

export interface MemoryEntry {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface BaseMemoryProvider {
  add(content: string, metadata?: Record<string, any>): Promise<string>;
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  get(id: string): Promise<MemoryEntry | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface FunctionTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
  handler: (params: any) => Promise<any>;
}
