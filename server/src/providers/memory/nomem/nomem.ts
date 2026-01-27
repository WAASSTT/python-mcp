import type { MemoryEntry } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { MemoryProvider } from "../base";

/**
 * No Memory Provider
 * 不使用记忆功能
 */
export class NoMemProvider extends MemoryProvider {
  constructor(config: any, logger: Logger) {
    super(config, logger);
    this.logger.info("NoMem provider initialized - memory disabled");
  }

  async add(_content: string, _metadata?: Record<string, any>): Promise<string> {
    this.logger.debug("nomem mode: No memory saving is performed.");
    return "no-mem";
  }

  async search(_query: string, _limit?: number): Promise<MemoryEntry[]> {
    this.logger.debug("nomem mode: No memory query is performed.");
    return [];
  }

  async get(_id: string): Promise<MemoryEntry | null> {
    this.logger.debug("nomem mode: No memory retrieval is performed.");
    return null;
  }

  async delete(_id: string): Promise<boolean> {
    this.logger.debug("nomem mode: No memory deletion is performed.");
    return true;
  }

  async clear(): Promise<void> {
    this.logger.debug("nomem mode: No memory clearing is performed.");
  }
}
