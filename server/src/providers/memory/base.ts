import type { BaseMemoryProvider, MemoryEntry } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { nanoid } from "nanoid";

export abstract class MemoryProvider implements BaseMemoryProvider {
  protected config: any;
  protected logger: Logger;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  abstract add(content: string, metadata?: Record<string, any>): Promise<string>;
  abstract search(query: string, limit?: number): Promise<MemoryEntry[]>;
  abstract get(id: string): Promise<MemoryEntry | null>;
  abstract delete(id: string): Promise<boolean>;
  abstract clear(): Promise<void>;

  protected createEntry(content: string, metadata?: Record<string, any>): MemoryEntry {
    return {
      id: nanoid(),
      content,
      metadata,
      timestamp: Date.now(),
    };
  }
}
