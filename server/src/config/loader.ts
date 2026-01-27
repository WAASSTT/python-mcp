import type { AppConfig } from "@/types/config";
import { config as defaultConfig } from "./config";

/**
 * 配置加载器
 * 优先级: 环境变量 > 默认配置
 */
export class ConfigLoader {
  private config: AppConfig | null = null;

  constructor() {}

  /**
   * 加载配置
   */
  async load(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    // 使用默认配置
    let config = JSON.parse(JSON.stringify(defaultConfig)) as AppConfig;

    // 替换环境变量
    config = this.replaceEnvVars(config);

    this.config = config;
    return config;
  }

  /**
   * 获取配置
   */
  get(): AppConfig {
    if (!this.config) {
      throw new Error("配置未加载，请先调用 load()");
    }
    return this.config;
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<AppConfig> {
    this.config = null;
    return this.load();
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }

    return output;
  }

  /**
   * 判断是否为对象
   */
  private isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  /**
   * 替换环境变量
   * ${VAR_NAME} -> process.env.VAR_NAME
   */
  private replaceEnvVars(obj: any): any {
    if (typeof obj === "string") {
      const match = obj.match(/\$\{([^}]+)\}/);
      if (match) {
        const envVar = process.env[match[1]];
        return envVar || obj;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.replaceEnvVars(item));
    }

    if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.replaceEnvVars(obj[key]);
      }
      return result;
    }

    return obj;
  }
}

// 单例
let configLoader: ConfigLoader | null = null;

export function getConfigLoader(): ConfigLoader {
  if (!configLoader) {
    configLoader = new ConfigLoader();
  }
  return configLoader;
}

export async function loadConfig(): Promise<AppConfig> {
  return getConfigLoader().load();
}
