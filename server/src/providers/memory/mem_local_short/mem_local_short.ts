import type { MemoryEntry } from "@/types/providers";
import type { Logger } from "@/utils/logger";

/**
 * Base Memory Provider Interface
 */
export abstract class MemoryProvider {
  protected logger: Logger;
  protected config: any;

  constructor(config: any, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Add a new memory entry
   */
  abstract add(content: string, metadata?: Record<string, any>): Promise<string>;

  /**
   * Search memory entries
   */
  abstract search(query: string, limit?: number): Promise<MemoryEntry[]>;

  /**
   * Get memory by ID
   */
  abstract get(id: string): Promise<MemoryEntry | null>;

  /**
   * Delete memory by ID
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Clear all memories
   */
  abstract clear(): Promise<void>;

  /**
   * Create a memory entry
   */
  protected createEntry(content: string, metadata?: Record<string, any>): MemoryEntry {
    return {
      id: crypto.randomUUID(),
      content,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Local Memory Provider (In-memory storage)
 */
export class LocalProvider extends MemoryProvider {
  private storage: Map<string, MemoryEntry> = new Map();

  constructor(config: any, logger: any) {
    super(config, logger);
    this.logger.info("Local Memory provider initialized");
  }

  async add(content: string, metadata?: Record<string, any>): Promise<string> {
    const entry = this.createEntry(content, metadata);
    this.storage.set(entry.id, entry);
    return entry.id;
  }

  async search(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    const lowerQuery = query.toLowerCase();

    for (const entry of this.storage.values()) {
      if (entry.content.toLowerCase().includes(lowerQuery)) {
        results.push(entry);
      }
    }

    return results.slice(0, limit);
  }

  async get(id: string): Promise<MemoryEntry | null> {
    return this.storage.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

export default LocalProvider;
