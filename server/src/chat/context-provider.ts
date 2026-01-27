/**
 * 上下文数据源配置
 */
export interface ContextSource {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * 上下文数据提供者配置
 */
export interface ContextProviderConfig {
  sources?: ContextSource[];
}

/**
 * 上下文数据
 */
export interface ContextData {
  [key: string]: any;
}

/**
 * 上下文数据提供者
 * 从外部 API 获取上下文数据并格式化
 */
export class ContextDataProvider {
  private sources: ContextSource[];

  constructor(config: ContextProviderConfig = {}) {
    this.sources = config.sources || [];
  }

  /**
   * 获取所有配置的上下文数据
   */
  async fetchAll(): Promise<string> {
    if (this.sources.length === 0) {
      return '';
    }

    const results = await Promise.allSettled(
      this.sources.map(source => this.fetchFromSource(source))
    );

    const formattedLines: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        formattedLines.push(...result.value);
      }
    }

    return formattedLines.length > 0
      ? `\n### 相关上下文信息\n${formattedLines.join('\n')}`
      : '';
  }

  /**
   * 从单个数据源获取数据
   */
  private async fetchFromSource(source: ContextSource): Promise<string[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), source.timeout || 3000);

      const response = await fetch(source.url, {
        headers: source.headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[ContextProvider] 请求失败: ${source.url}, 状态: ${response.status}`);
        return [];
      }

      const result = await response.json() as { code?: number; data?: any };

      if (result.code === 0 && result.data) {
        return this.formatData(result.data);
      }

      return [];
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`[ContextProvider] 获取数据失败: ${source.url}, 错误: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * 格式化数据
   */
  private formatData(data: any): string[] {
    const lines: string[] = [];

    if (typeof data === 'object' && !Array.isArray(data)) {
      // 对象格式
      for (const [key, value] of Object.entries(data)) {
        lines.push(`- **${key}：** ${value}`);
      }
    } else if (Array.isArray(data)) {
      // 数组格式
      for (const item of data) {
        lines.push(`- ${item}`);
      }
    } else {
      // 其他格式
      lines.push(`- ${data}`);
    }

    return lines;
  }

  /**
   * 添加数据源
   */
  addSource(source: ContextSource): void {
    this.sources.push(source);
  }

  /**
   * 移除数据源
   */
  removeSource(url: string): void {
    this.sources = this.sources.filter(s => s.url !== url);
  }

  /**
   * 获取数据源列表
   */
  getSources(): ContextSource[] {
    return [...this.sources];
  }
}

/**
 * 创建上下文数据提供者
 */
export function createContextProvider(config?: ContextProviderConfig): ContextDataProvider {
  return new ContextDataProvider(config);
}
