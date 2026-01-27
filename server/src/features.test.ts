import { Dialogue } from "@/chat/dialogue";
import { Message } from "@/chat/message";
import { PromptManager } from "@/chat/prompt-manager";
import { beforeAll, describe, expect, it } from "bun:test";
// Note: Plugin system is deprecated, use providers/tools instead
// import { PluginManager } from '@/plugins/plugin-manager';

describe("提示词管理器测试", () => {
  let promptManager: PromptManager;

  beforeAll(() => {
    promptManager = new PromptManager({
      basePrompt: "你是一个测试助手",
    });
  });

  it("应该能够加载提示词模板", async () => {
    await promptManager.loadTemplate();
    expect(promptManager).toBeDefined();
  });

  it("应该能够构建系统提示词", async () => {
    const systemPrompt = await promptManager.buildSystemPrompt({
      currentTime: "2024年01月01日 12:00",
      todayDate: "2024年01月01日",
      todayWeekday: "星期一",
      lunarDate: "甲辰年腊月初一",
      localAddress: "北京",
      memory: "用户: 你好\n助手: 你好呀！",
    });

    expect(systemPrompt).toContain("测试助手");
    expect(systemPrompt).toContain("2024年01月01日");
    expect(systemPrompt).toContain("星期一");
  });

  it("应该能够解析说话人信息", () => {
    const result1 = promptManager.parseSpeakerMessage(
      '{"speaker":"张三","content":"今天天气怎么样"}',
    );
    expect(result1.speaker).toBe("张三");
    expect(result1.content).toBe("今天天气怎么样");

    const result2 = promptManager.parseSpeakerMessage("普通消息");
    expect(result2.speaker).toBeUndefined();
    expect(result2.content).toBe("普通消息");
  });

  it("应该能够获取 Emoji 列表", () => {
    const emojis = promptManager.getEmojiList();
    expect(emojis.length).toBeGreaterThan(0);
    expect(emojis.length).toBe(21); // 检查数量
    expect(emojis[1]).toBe("🙂"); // 检查第二个 emoji
  });

  it("应该能够获取星期名称", () => {
    const date = new Date("2024-01-01"); // 星期一
    const weekday = promptManager.getWeekdayName(date);
    expect(weekday).toBe("星期一");
  });
});

describe("对话管理器测试", () => {
  let dialogue: Dialogue;

  beforeAll(() => {
    dialogue = new Dialogue({
      maxMessages: 10,
      autoCleanup: true,
    });
  });

  it("应该能够添加用户消息", () => {
    const message = dialogue.addUserMessage("你好");
    expect(message.role).toBe("user");
    expect(message.content).toBe("你好");
    expect(dialogue.getLength()).toBe(1);
  });

  it("应该能够添加助手消息", () => {
    const message = dialogue.addAssistantMessage("你好呀！");
    expect(message.role).toBe("assistant");
    expect(message.content).toBe("你好呀！");
    expect(dialogue.getLength()).toBe(2);
  });

  it("应该能够添加系统消息", () => {
    const message = dialogue.addSystemMessage("你是一个助手");
    expect(message.role).toBe("system");
    expect(dialogue.getLength()).toBe(3);
  });

  it("应该能够获取 LLM 格式的对话", () => {
    const llmDialogue = dialogue.getLLMDialogue();
    expect(llmDialogue.length).toBeGreaterThan(0);
    expect(llmDialogue[0]).toHaveProperty("role");
    expect(llmDialogue[0]).toHaveProperty("content");
  });

  it("应该能够获取最近的消息", () => {
    const recent = dialogue.getRecentMessages(2);
    expect(recent.length).toBeLessThanOrEqual(2);
  });

  it("应该能够按角色筛选消息", () => {
    const userMessages = dialogue.filterByRole("user");
    expect(userMessages.every((msg) => msg.role === "user")).toBe(true);
  });

  it("应该能够导出和导入对话", () => {
    const exported = dialogue.export();
    expect(exported).toHaveProperty("sessionId");
    expect(exported).toHaveProperty("messages");

    const imported = Dialogue.import(exported);
    expect(imported.getLength()).toBe(dialogue.getLength());
  });

  it("应该能够清空对话", () => {
    dialogue.clear();
    expect(dialogue.getLength()).toBe(0);
  });
});

describe("消息类测试", () => {
  it("应该能够创建消息", () => {
    const message = new Message({
      role: "user",
      content: "测试消息",
    });

    expect(message.role).toBe("user");
    expect(message.content).toBe("测试消息");
    expect(message.uniqId).toBeDefined();
    expect(message.timestamp).toBeGreaterThan(0);
  });

  it("应该能够转换为 LLM 格式", () => {
    const message = new Message({
      role: "assistant",
      content: "响应消息",
    });

    const llmFormat = message.toLLMFormat();
    expect(llmFormat.role).toBe("assistant");
    expect(llmFormat.content).toBe("响应消息");
  });

  it("应该能够从 LLM 格式创建消息", () => {
    const llmData = {
      role: "user",
      content: "从 LLM 格式创建",
    };

    const message = Message.fromLLMFormat(llmData);
    expect(message.role).toBe("user");
    expect(message.content).toBe("从 LLM 格式创建");
  });

  it("应该能够克隆消息", () => {
    const original = new Message({
      role: "user",
      content: "原始消息",
    });

    const cloned = original.clone();
    expect(cloned.uniqId).toBe(original.uniqId);
    expect(cloned.content).toBe(original.content);
  });

  it("应该能够获取消息摘要", () => {
    const message = new Message({
      role: "user",
      content: "这是一条很长的消息内容".repeat(10),
    });

    const summary = message.getSummary(20);
    expect(summary.length).toBeLessThanOrEqual(30);
    expect(summary).toContain("...");
  });
});
