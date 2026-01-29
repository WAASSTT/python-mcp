/**
 * WebSocket 连接器
 * 直接连接到本地服务端的 WebSocket
 */

import type { DeviceConfig } from "../../config/manager";
import { logger } from "../../utils/logger";

/**
 * 验证配置
 */
function validateConfig(config: DeviceConfig): boolean {
  if (!config.deviceId) {
    logger.error("设备ID不能为空");
    return false;
  }
  if (!config.clientId) {
    logger.error("客户端ID不能为空");
    return false;
  }
  return true;
}

/**
 * WebSocket 连接
 * 直接连接到本地服务端
 */
export async function webSocketConnect(
  serverUrl: string,
  config: DeviceConfig
): Promise<WebSocket | null> {
  if (!validateConfig(config)) {
    return null;
  }

  // 构建本地服务端的 WebSocket URL
  // serverUrl 应该是类似 "http://127.0.0.1:30000" 的格式
  let wsBaseUrl: string;
  try {
    const url = new URL(serverUrl);
    // 将 http/https 转换为 ws/wss
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    wsBaseUrl = `${protocol}//${url.host}/ws/v1`;
  } catch (error: any) {
    logger.error(`无效的服务器URL: ${error.message}`);
    return null;
  }

  // 构建完整的 WebSocket URL
  const connUrl = new URL(wsBaseUrl);

  // 添加认证参数
  connUrl.searchParams.append("device-id", config.deviceId);
  connUrl.searchParams.append("client-id", config.clientId);

  // 如果有 token，添加到参数中
  if (config.token) {
    const token = config.token.startsWith("Bearer ")
      ? config.token
      : `Bearer ${config.token}`;
    connUrl.searchParams.append("authorization", token);
  }

  const wsUrl = connUrl.toString();
  logger.info(`正在连接到本地服务端: ${wsUrl}`);

  try {
    return new WebSocket(wsUrl);
  } catch (error: any) {
    logger.error(`WebSocket连接失败: ${error.message}`);
    return null;
  }
}
