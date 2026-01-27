import type { Logger } from "@/utils/logger";
import { TTSProvider } from "./base";
import { HuoshanStreamTTSProvider } from "./huoshan_stream";

/**
 * TTS Provider Factory
 */
export function createTTSProvider(type: string, config: any, logger: Logger): TTSProvider {
  switch (type.toLowerCase()) {
    case "huoshan":
    case "huoshanstream":
    case "huoshandoublestream":
    case "huoshandoublestreamtts":
      return new HuoshanStreamTTSProvider(config, logger);
    default:
      throw new Error(`Unknown TTS provider type: ${type}`);
  }
}
