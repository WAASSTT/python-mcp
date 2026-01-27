import type { MemoryEntry, Message } from "@/types/providers";
import type { Logger } from "@/utils/logger";
import { MemoryProvider } from "../base";

/**
 * Mem0 AI API 客户端配置
 */
interface Mem0AIConfig {
  api_key: string;
  api_version?: string;
  role_id?: string;
}

/**
 * Mem0 AI API 响应
 */
interface Mem0SearchResult {
  results?: Array<{
    memory: string;
    updated_at?: string;
    id?: string;
  }>;
}

/**
 * Mem0 AI Memory Provider
 * 使用 Mem0 AI 服务进行记忆管理
 * https://mem0.ai/
 */
export class Mem0AIProvider extends MemoryProvider {
  private apiKey: string;
  private apiVersion: string;
  private roleId: string;
  private baseUrl: string;
  private useMem0: boolean;

  constructor(config: Mem0AIConfig, logger: Logger) {
    super(config, logger);

    this.apiKey = config.api_key || "";
    this.apiVersion = config.api_version || "v1.1";
    this.roleId = config.role_id || "default_user";
    this.baseUrl = `https://api.mem0.ai/${this.apiVersion}`;
    this.useMem0 = !!this.apiKey;

    if (!this.useMem0) {
      this.logger.error("Mem0AI API key is missing");
    } else {
      this.logger.info("Mem0AI provider initialized successfully");
    }
  }

  /**
   * 保存消息到 Mem0 AI
   */
  async saveMessages(messages: Message[]): Promise<boolean> {
    if (!this.useMem0 || messages.length < 2) {
      return false;
    }

    try {
      // 过滤掉 system 消息
      const filteredMessages = messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch(`${this.baseUrl}/memories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
        body: JSON.stringify({
          messages: filteredMessages,
          user_id: this.roleId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to save memory: ${error}`);
        return false;
      }

      const result = await response.json();
      this.logger.debug(`Save memory result: ${JSON.stringify(result)}`);
      return true;
    } catch (error) {
      this.logger.error(`Save memory failed: ${error}`);
      return false;
    }
  }

  /**
   * 添加记忆
   */
  async add(content: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.useMem0) {
      return "";
    }

    try {
      const response = await fetch(`${this.baseUrl}/memories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          user_id: metadata?.user_id || this.roleId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to add memory: ${error}`);
        return "";
      }

      const result = (await response.json()) as { id?: string };
      return result.id || "";
    } catch (error) {
      this.logger.error(`Add memory failed: ${error}`);
      return "";
    }
  }

  /**
   * 搜索记忆
   */
  async search(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    if (!this.useMem0) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/memories/search/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          user_id: this.roleId,
          limit,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to search memories: ${error}`);
        return [];
      }

      const data = (await response.json()) as Mem0SearchResult;
      if (!data.results || data.results.length === 0) {
        return [];
      }

      // 转换为 MemoryEntry 格式
      const memories = data.results
        .map((entry) => {
          if (!entry.memory) return null;

          let timestamp = new Date().toISOString();
          if (entry.updated_at) {
            try {
              const dt = entry.updated_at.split(".")[0];
              timestamp = new Date(dt).toISOString();
            } catch {
              timestamp = entry.updated_at;
            }
          }

          return {
            id: entry.id || this.generateId(),
            content: entry.memory,
            metadata: {
              updated_at: timestamp,
            },
            timestamp,
          } as MemoryEntry;
        })
        .filter((entry): entry is MemoryEntry => entry !== null);

      // 按时间倒序排序
      memories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return memories;
    } catch (error) {
      this.logger.error(`Search memories failed: ${error}`);
      return [];
    }
  }

  /**
   * 查询记忆并格式化为字符串
   */
  async queryMemory(query: string): Promise<string> {
    const memories = await this.search(query, 10);
    if (memories.length === 0) {
      return "";
    }

    const formatted = memories
      .map((entry) => {
        const time = entry.metadata?.updated_at || entry.timestamp;
        const formattedTime = new Date(time).toISOString().replace("T", " ").split(".")[0];
        return `- [${formattedTime}] ${entry.content}`;
      })
      .join("\n");

    this.logger.debug(`Query results: ${formatted}`);
    return formatted;
  }

  /**
   * 获取指定记忆
   */
  async get(id: string): Promise<MemoryEntry | null> {
    if (!this.useMem0) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/memories/${id}/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        id?: string;
        memory?: string;
        content?: string;
        metadata?: Record<string, any>;
        updated_at?: string;
        created_at?: string;
      };

      return {
        id: data.id || "",
        content: data.memory || data.content || "",
        metadata: data.metadata || {},
        timestamp: data.updated_at || data.created_at || new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Get memory failed: ${error}`);
      return null;
    }
  }

  /**
   * 删除记忆
   */
  async delete(id: string): Promise<boolean> {
    if (!this.useMem0) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/memories/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.error(`Delete memory failed: ${error}`);
      return false;
    }
  }

  /**
   * 清空所有记忆
   */
  async clear(): Promise<void> {
    if (!this.useMem0) {
      return;
    }

    try {
      // Mem0 AI 可能需要先获取所有记忆 ID，然后逐个删除
      // 或者使用特定的清空 API（如果存在）
      const response = await fetch(`${this.baseUrl}/memories/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: this.roleId,
        }),
      });

      if (response.ok) {
        this.logger.info("All Mem0AI memories cleared successfully");
      } else {
        this.logger.warn(`Failed to clear memories: ${await response.text()}`);
      }
    } catch (error) {
      this.logger.error(`Clear memories failed: ${error}`);
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `mem0_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
