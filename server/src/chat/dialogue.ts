import type { MessageRole, ToolCall } from "./message";
import { Message } from "./message";

// 重新导出 Message 类，方便其他模块导入
export { Message } from "./message";
export type { IMessage, MessageRole, ToolCall } from "./message";

/**
 * 对话配置
 */
export interface DialogueConfig {
  maxMessages?: number;
  autoCleanup?: boolean;
  keepSystemMessage?: boolean;
}

/**
 * 对话管理类
 */
export class Dialogue {
  private messages: Message[] = [];
  private maxMessages: number;
  private autoCleanup: boolean;
  private keepSystemMessage: boolean;
  private sessionId: string;

  constructor(config: DialogueConfig = {}) {
    this.maxMessages = config.maxMessages || 20;
    this.autoCleanup = config.autoCleanup !== false;
    this.keepSystemMessage = config.keepSystemMessage !== false;
    this.sessionId = this.generateSessionId();
  }

  put(message: Message): void {
    this.messages.push(message);
    if (this.autoCleanup && this.messages.length > this.maxMessages) {
      this.cleanupOldMessages();
    }
  }

  addUserMessage(content: string, speakerName?: string): Message {
    const message = new Message({ role: "user", content, speakerName });
    this.put(message);
    return message;
  }

  addAssistantMessage(content: string, toolCalls?: ToolCall[]): Message {
    const message = new Message({ role: "assistant", content, toolCalls });
    this.put(message);
    return message;
  }

  addSystemMessage(content: string): Message {
    const message = new Message({ role: "system", content });
    this.put(message);
    return message;
  }

  addToolMessage(content: string, toolCallId: string): Message {
    const message = new Message({ role: "tool", content, toolCallId });
    this.put(message);
    return message;
  }

  getLLMDialogue(): any[] {
    return this.messages.map((msg) => msg.toLLMFormat());
  }

  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  getAllMessages(): Message[] {
    return [...this.messages];
  }

  private cleanupOldMessages(): void {
    if (this.keepSystemMessage) {
      const systemMessages = this.messages.filter((msg) => msg.role === "system");
      const otherMessages = this.messages.filter((msg) => msg.role !== "system");
      const keepCount = this.maxMessages - systemMessages.length;
      this.messages = [...systemMessages, ...otherMessages.slice(-keepCount)];
    } else {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  clear(): void {
    this.messages = [];
  }

  getLength(): number {
    return this.messages.length;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  findMessage(uniqId: string): Message | undefined {
    return this.messages.find((msg) => msg.uniqId === uniqId);
  }

  filterByRole(role: MessageRole): Message[] {
    return this.messages.filter((msg) => msg.role === role);
  }

  getSummary(): string {
    return this.messages.map((msg) => msg.getSummary()).join("\n");
  }

  export(): any {
    return {
      sessionId: this.sessionId,
      messages: this.messages.map((msg) => ({
        uniqId: msg.uniqId,
        role: msg.role,
        content: msg.content,
        toolCalls: msg.toolCalls,
        toolCallId: msg.toolCallId,
        speakerName: msg.speakerName,
        timestamp: msg.timestamp,
      })),
    };
  }

  static import(data: any): Dialogue {
    const dialogue = new Dialogue();
    dialogue.sessionId = data.sessionId;
    dialogue.messages = data.messages.map((msg: any) => new Message(msg));
    return dialogue;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
