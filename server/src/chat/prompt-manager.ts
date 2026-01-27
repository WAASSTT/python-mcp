import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * 提示词配置接口
 */
export interface PromptConfig {
  basePrompt?: string;
  templatePath?: string;
}

/**
 * 提示词上下文接口
 */
export interface PromptContext {
  memory?: string;
  currentTime?: string;
  todayDate?: string;
  todayWeekday?: string;
  lunarDate?: string;
  localAddress?: string;
  weatherInfo?: string;
  dynamicContext?: string;
  speakerName?: string;
}

/**
 * 提示词管理器
 * 负责加载和渲染 Agent 提示词模板
 */
export class PromptManager {
  private basePrompt: string;
  private templatePath: string;
  private template: string | null = null;

  /**
   * 预定义的 Emoji 列表
   */
  private readonly emojiList = [
    '😶', '🙂', '😆', '😂', '😔', '😠', '😭', '😍',
    '😳', '😲', '😱', '🤔', '😉', '😎', '😌', '🤤',
    '😘', '😏', '😴', '😜', '🙄'
  ];

  /**
   * 星期映射表
   */
  private readonly weekdayMap: Record<number, string> = {
    0: '星期日',
    1: '星期一',
    2: '星期二',
    3: '星期三',
    4: '星期四',
    5: '星期五',
    6: '星期六'
  };

  constructor(config: PromptConfig = {}) {
    this.basePrompt = config.basePrompt || '你是一个智能助手，友好、专业、乐于助人。';
    this.templatePath = config.templatePath || join(process.cwd(), 'prompts', 'agent-base.txt');
  }

  /**
   * 加载提示词模板
   */
  async loadTemplate(): Promise<void> {
    try {
      this.template = await readFile(this.templatePath, 'utf-8');
    } catch (error) {
      console.warn(`[PromptManager] 无法加载模板文件 ${this.templatePath}，使用默认提示词`);
      this.template = this.getDefaultTemplate();
    }
  }

  /**
   * 构建系统提示词
   */
  async buildSystemPrompt(context: PromptContext = {}): Promise<string> {
    if (!this.template) {
      await this.loadTemplate();
    }

    const currentTime = context.currentTime || this.getCurrentTimeString();
    const emojiListStr = this.emojiList.join(' ');

    let prompt = this.template!;

    // 模板变量替换（匹配 Python 服务端的变量名）
    prompt = prompt.replace(/\{\{base_prompt\}\}/g, this.basePrompt);  // Python: base_prompt
    prompt = prompt.replace(/\{\{basePrompt\}\}/g, this.basePrompt);    // 兼容旧版
    prompt = prompt.replace(/\{\{ emojiList \}\}/g, emojiListStr);      // Python: {{ emojiList }}
    prompt = prompt.replace(/\{\{emojiList\}\}/g, emojiListStr);        // 兼容旧版
    prompt = prompt.replace(/\{\{current_time\}\}/g, currentTime);
    prompt = prompt.replace(/\{\{today_date\}\}/g, context.todayDate || '');
    prompt = prompt.replace(/\{\{today_weekday\}\}/g, context.todayWeekday || '');
    prompt = prompt.replace(/\{\{lunar_date\}\}/g, context.lunarDate || '');
    prompt = prompt.replace(/\{\{local_address\}\}/g, context.localAddress || '北京');
    prompt = prompt.replace(/\{\{weather_info\}\}/g, context.weatherInfo || '');
    prompt = prompt.replace(/\{\{ dynamic_context \}\}/g, context.dynamicContext || '');
    prompt = prompt.replace(/\{\{memory\}\}/g, context.memory || '');

    return prompt;
  }

  /**
   * 获取当前时间字符串
   */
  private getCurrentTimeString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const weekday = this.weekdayMap[now.getDay()];

    return `当前时间：${year}年${month}月${day}日 ${hour}:${minute} ${weekday}`;
  }

  /**
   * 解析说话人信息
   */
  parseSpeakerMessage(content: string): { speaker?: string; content: string } {
    try {
      const parsed = JSON.parse(content);
      if (parsed.speaker && parsed.content) {
        return {
          speaker: parsed.speaker,
          content: parsed.content
        };
      }
    } catch {
      // 不是 JSON 格式，直接返回原内容
    }
    return { content };
  }

  /**
   * 获取默认模板
   */
  private getDefaultTemplate(): string {
    return `<identity>
{{basePrompt}}
</identity>

<emotion>
使用这些 emoji 表达情感：{{emojiList}}
</emotion>

<current_context>
{{currentTime}}
{{contextData}}
{{memory}}
</current_context>`;
  }

  /**
   * 获取 Emoji 列表
   */
  getEmojiList(): string[] {
    return [...this.emojiList];
  }

  /**
   * 获取星期名称
   */
  getWeekdayName(date: Date = new Date()): string {
    return this.weekdayMap[date.getDay()];
  }
}

/**
 * 创建默认的 PromptManager 实例
 */
export function createPromptManager(config?: PromptConfig): PromptManager {
  return new PromptManager(config);
}
