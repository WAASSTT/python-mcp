// VAD Providers index
export { SimpleVADProvider, VADProvider, type VADConfig, type VADResult } from "./base";
export { SileroVADProvider } from "./silero";

import type { Logger } from "@/utils/logger";
import { VADProvider } from "./base";
import { SileroVADProvider } from "./silero";

/**
 * VAD Provider Factory
 */
export function createVADProvider(type: string, config: any, logger: Logger): VADProvider {
  switch (type.toLowerCase()) {
    case "silero":
    case "silerovad":
      return new SileroVADProvider({ ...config, type: "silero" }, logger);
    default:
      throw new Error(`Unknown VAD provider type: ${type}`);
  }
}
