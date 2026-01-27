/**
 * OTA 连接器
 * 用于通过 OTA 接口获取 WebSocket 连接信息
 */

import type { DeviceConfig } from "../../config/manager";
import { logger } from "../../utils/logger";

export interface OTAResponse {
  websocket?: {
    url: string;
    token?: string;
  };
  [key: string]: any;
}

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
 * 发送 OTA 请求
 */
async function sendOTA(
  otaUrl: string,
  config: DeviceConfig
): Promise<OTAResponse | null> {
  try {
    const response = await fetch(otaUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Device-Id": config.deviceId,
        "Client-Id": config.clientId,
      },
      body: JSON.stringify({
        version: 0,
        uuid: "",
        application: {
          name: "xiaozhi-electron-client",
          version: "1.0.0",
          compile_time: new Date().toISOString(),
          idf_version: "4.4.3",
          elf_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef",
        },
        ota: { label: "xiaozhi-electron-client" },
        board: {
          type: "electron",
          ssid: "electron-client",
          mac: config.deviceId,
          ip: "127.0.0.1",
        },
      }),
    });

    if (!response.ok) {
      logger.error(`OTA请求失败: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    logger.success("OTA响应成功");
    logger.debug(`OTA响应: ${JSON.stringify(data, null, 2)}`);

    return data;
  } catch (error: any) {
    logger.error(`OTA请求错误: ${error.message}`);
    return null;
  }
}

/**
 * WebSocket 连接
 */
export async function webSocketConnect(
  otaUrl: string,
  config: DeviceConfig
): Promise<WebSocket | null> {
  if (!validateConfig(config)) {
    return null;
  }

  // 发送 OTA 请求并获取返回的 WebSocket 信息
  const otaResult = await sendOTA(otaUrl, config);
  if (!otaResult) {
    logger.error("无法从OTA服务器获取信息");
    return null;
  }

  // 从 OTA 响应中提取 WebSocket 信息
  const { websocket } = otaResult;
  if (!websocket || !websocket.url) {
    logger.error("OTA响应中缺少websocket信息");
    return null;
  }

  // 使用 OTA 返回的 WebSocket URL
  const connUrl = new URL(websocket.url);

  // 添加 token 参数
  if (websocket.token) {
    const token = websocket.token.startsWith("Bearer ")
      ? websocket.token
      : `Bearer ${websocket.token}`;
    connUrl.searchParams.append("authorization", token);
  }

  // 添加认证参数
  connUrl.searchParams.append("device-id", config.deviceId);
  connUrl.searchParams.append("client-id", config.clientId);

  const wsUrl = connUrl.toString();
  logger.info(`正在连接: ${wsUrl}`);

  try {
    return new WebSocket(wsUrl);
  } catch (error: any) {
    logger.error(`WebSocket连接失败: ${error.message}`);
    return null;
  }
}
