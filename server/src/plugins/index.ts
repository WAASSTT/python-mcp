/**
 * 插件系统 - 已废弃，统一使用 providers/tools
 * 保留 PluginManager 用于向后兼容
 */
import { PluginManager } from "./plugin-manager";

/**
 * @deprecated 使用 createToolModule from '@/providers/tools' 替代
 */
export function createDefaultPluginManager(): PluginManager {
  console.warn(
    "[Deprecated] createDefaultPluginManager is deprecated. Use createToolModule from @/providers/tools instead.",
  );
  return new PluginManager();
}

// 导出类型和管理器（向后兼容）
export { PluginManager } from "./plugin-manager";
export type { Plugin, PluginResult } from "./plugin-manager";
