/**
 * 统一配置管理 - 使用 YAML 配置文件
 *
 * 配置优先级: data/.config.yaml > config.yaml > 环境变量
 *
 * 学习自: xiaozhi-esp32-server/config/config_loader.py
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import type { AppConfig } from "./types/config";

/** 项目根目录 */
const PROJECT_DIR = join(import.meta.dir, "..");

/** 递归合并配置对象（custom_config 优先级更高） */
function mergeConfigs(defaultConfig: any, customConfig: any): any {
  if (
    typeof defaultConfig !== "object" ||
    defaultConfig === null ||
    typeof customConfig !== "object" ||
    customConfig === null
  ) {
    return customConfig ?? defaultConfig;
  }

  if (Array.isArray(customConfig)) {
    return customConfig;
  }

  const merged = { ...defaultConfig };

  for (const [key, value] of Object.entries(customConfig)) {
    if (
      key in merged &&
      typeof merged[key] === "object" &&
      merged[key] !== null &&
      !Array.isArray(merged[key]) &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      merged[key] = mergeConfigs(merged[key], value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

/** 加载 YAML 文件 */
function loadYaml(filePath: string): any {
  try {
    const content = readFileSync(filePath, "utf-8");
    return parse(content) || {};
  } catch (error) {
    console.warn(`⚠️  Failed to load ${filePath}:`, error);
    return {};
  }
}

/** 加载配置 */
export function loadConfig(): AppConfig {
  console.log("🔧 Loading configuration...");

  // 1. 加载默认配置模板
  const defaultConfigPath = join(PROJECT_DIR, "config.yaml");
  console.log(`📄 Loading default config: ${defaultConfigPath}`);
  const defaultConfig = loadYaml(defaultConfigPath);
  console.log("✅ Default config loaded:", Object.keys(defaultConfig || {}));

  // 2. 加载用户自定义配置
  const customConfigPath = join(PROJECT_DIR, "data/.config.yaml");
  console.log(`📄 Loading custom config: ${customConfigPath}`);
  const customConfig = existsSync(customConfigPath) ? loadYaml(customConfigPath) : {};
  console.log("✅ Custom config loaded:", Object.keys(customConfig || {}));

  // 3. 合并配置（custom 优先级更高）
  const merged = mergeConfigs(defaultConfig, customConfig);
  console.log("✅ Config merged:", Object.keys(merged || {}));

  // 4. 应用 selected_module 选择
  if (merged.selected_module) {
    console.log("🎯 Applying selected_module:", merged.selected_module);
    // 从 selected_module 中提取默认值
    merged.vad.default = merged.selected_module.VAD || merged.vad.default;
    merged.asr.default = merged.selected_module.ASR || merged.asr.default;
    merged.llm.default = merged.selected_module.LLM || merged.llm.default;
    merged.vllm.default = merged.selected_module.VLLM || merged.vllm.default;
    merged.tts.default = merged.selected_module.TTS || merged.tts.default;
    merged.memory.default = merged.selected_module.Memory || merged.memory.default;
    merged.intent.default = merged.selected_module.Intent || merged.intent.default;

    console.log(
      `✅ Applied defaults: LLM=${merged.llm.default}, ASR=${merged.asr.default}, TTS=${merged.tts.default}`,
    );
  }

  // 5. 环境变量覆盖（支持环境变量优先级最高）
  if (process.env.SELECTED_LLM) {
    merged.llm.default = process.env.SELECTED_LLM;
  }
  if (process.env.SELECTED_ASR) {
    merged.asr.default = process.env.SELECTED_ASR;
  }
  if (process.env.SELECTED_TTS) {
    merged.tts.default = process.env.SELECTED_TTS;
  }

  console.log("✅ Configuration loaded successfully");
  return merged as AppConfig;
}

/** 全局配置实例 */
export const config = loadConfig();

/** 默认导出 */
export default config;

/** 获取 LLM 配置 */
export const getLLMConfig = (provider: string = config.llm.default) => {
  return config.llm.providers[provider];
};

/** 获取 vLLM 配置 */
export const getVLLMConfig = (provider: string = config.vllm.default) => {
  return config.vllm.providers[provider];
};

/** 打印配置摘要 */
export function printConfigSummary(config: AppConfig): void {
  console.log("\n📋 Configuration Summary:");
  console.log("═══════════════════════════════════════");
  console.log(
    `🔧 Config Source:   ${existsSync(join(PROJECT_DIR, "data/.config.yaml")) ? "data/.config.yaml + config.yaml" : "config.yaml only"}`,
  );
  console.log(`📝 Log Level:       ${config.log?.log_level || "INFO"}`);
  console.log(`🎯 Default LLM:     ${config.llm?.default || "N/A"}`);
  console.log(`🎤 Default ASR:     ${config.asr?.default || "N/A"}`);
  console.log(`🔊 Default TTS:     ${config.tts?.default || "N/A"}`);
  console.log(`👁️  Default vLLM:    ${config.vllm?.default || "N/A"}`);
  console.log(`🧠 Default Memory:  ${config.memory?.default || "N/A"}`);
  console.log("═══════════════════════════════════════\n");
}

/** 验证配置 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查配置基本结构
  if (!config.llm) {
    errors.push("LLM configuration is missing");
    return { valid: false, errors };
  }

  if (!config.llm.providers) {
    errors.push("LLM providers configuration is missing");
    return { valid: false, errors };
  }

  // 检查必需的 API Keys
  const defaultProviderName = config.llm.default;
  console.log(`🔍 Validating LLM provider: ${defaultProviderName}`);
  console.log(`📦 Available providers:`, Object.keys(config.llm.providers));

  const defaultLLM = config.llm.providers[defaultProviderName];
  console.log(`🔑 Provider config:`, defaultLLM);

  if (!defaultLLM?.api_key) {
    errors.push(`LLM API_KEY is required for provider: ${config.llm?.default}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
