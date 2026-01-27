import { randomUUID } from 'crypto';

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * 工具调用接口
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * 消息接口
 */
export interface IMessage {
  uniqId: string;
  role: MessageRole;
  content?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  speakerName?: string;
  timestamp: number;
}

/**
 * 消息类
 */
export class Message implements IMessage {
  uniqId: string;
  role: MessageRole;
  content?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  speakerName?: string;
  timestamp: number;

  constructor(data: {
    role: MessageRole;
    content?: string;
    toolCalls?: ToolCall[];
    toolCallId?: string;
    speakerName?: string;
    uniqId?: string;
  }) {
    this.uniqId = data.uniqId || randomUUID();
    this.role = data.role;
    this.content = data.content;
    this.toolCalls = data.toolCalls;
    this.toolCallId = data.toolCallId;
    this.speakerName = data.speakerName;
    this.timestamp = Date.now();
  }

  toLLMFormat(): any {
    const base: any = { role: this.role };
    if (this.content) base.content = this.content;
    if (this.toolCalls) base.tool_calls = this.toolCalls;
    if (this.toolCallId) base.tool_call_id = this.toolCallId;
    return base;
  }

  static fromLLMFormat(data: any): Message {
    return new Message({
      role: data.role,
      content: data.content,
      toolCalls: data.tool_calls,
      toolCallId: data.tool_call_id,
    });
  }

  clone(): Message {
    return new Message({
      role: this.role,
      content: this.content,
      toolCalls: this.toolCalls ? [...this.toolCalls] : undefined,
      toolCallId: this.toolCallId,
      speakerName: this.speakerName,
      uniqId: this.uniqId,
    });
  }

  getSummary(maxLength: number = 50): string {
    if (!this.content) return `[${this.role}]`;
    const content = this.content.length > maxLength
      ? this.content.substring(0, maxLength) + '...'
      : this.content;
    return `[${this.role}] ${content}`;
  }
}
