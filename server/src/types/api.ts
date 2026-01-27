export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatRequest {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  provider?: string;
}

export interface TranscribeRequest {
  audio: File | Blob;
  language?: string;
  provider?: string;
}

export interface SynthesizeRequest {
  text: string;
  voice?: string;
  speed?: number;
  format?: "mp3" | "opus" | "pcm";
  provider?: string;
}

export interface VisionRequest {
  image: string; // base64
  prompt: string;
  provider?: string;
}

export interface IntentRequest {
  text: string;
  provider?: string;
}

export interface MemoryAddRequest {
  content: string;
  metadata?: Record<string, any>;
}

export interface MemorySearchRequest {
  query: string;
  limit?: number;
}

export interface WebSocketMessage {
  type:
    | "hello"
    | "audio"
    | "text"
    | "intent"
    | "error"
    | "close"
    | "listen"
    | "abort"
    | "iot"
    | "stt"
    | "tts"
    | "goodbye"
    | "intent_ack"
    | "intent_result"
    | "iot_ack"
    | "iot_result"
    | "iot_error";
  data?: any;
  session_id?: string;
  timestamp?: number;
}
