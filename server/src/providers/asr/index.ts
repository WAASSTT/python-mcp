import type { Logger } from "@/utils/logger";
import { ASRProvider } from "./base";
import { DoubaoStreamASRProvider } from "./doubao_stream";

/**
 * ASR Provider Factory
 */
export function createASRProvider(type: string, config: any, logger: Logger): ASRProvider {
  switch (type.toLowerCase()) {
    case "doubaostream":
    case "doubaostreamasr":
    case "doubao_stream":
      return new DoubaoStreamASRProvider(config, logger);
    default:
      throw new Error(`Unknown ASR provider type: ${type}`);
  }
}
