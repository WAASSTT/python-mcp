/**
 * 配置管理模块
 */

export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  clientId: string;
  token?: string;
}

export interface ConnectionConfig {
  serverUrl: string;
  wsUrl?: string;
}

const STORAGE_KEYS = {
  DEVICE_ID: "xz_device_id",
  DEVICE_NAME: "xz_device_name",
  CLIENT_ID: "xz_client_id",
  TOKEN: "xz_token",
  SERVER_URL: "xz_server_url",
  WS_URL: "xz_ws_url",
} as const;

class ConfigManager {
  /**
   * 生成随机设备 ID (MAC 地址格式)
   */
  public generateDeviceId(): string {
    const hexDigits = "0123456789ABCDEF";
    const parts: string[] = [];
    for (let i = 0; i < 6; i++) {
      let segment = "";
      for (let j = 0; j < 2; j++) {
        segment += hexDigits.charAt(Math.floor(Math.random() * 16));
      }
      parts.push(segment);
    }
    return parts.join(":");
  }

  /**
   * 加载设备配置
   */
  public loadDeviceConfig(): DeviceConfig {
    let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    }

    return {
      deviceId,
      deviceName:
        localStorage.getItem(STORAGE_KEYS.DEVICE_NAME) || "Web测试设备",
      clientId:
        localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || "web_test_client",
      token: localStorage.getItem(STORAGE_KEYS.TOKEN) || undefined,
    };
  }

  /**
   * 保存设备配置
   */
  public saveDeviceConfig(config: DeviceConfig): void {
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, config.deviceId);
    localStorage.setItem(STORAGE_KEYS.DEVICE_NAME, config.deviceName);
    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, config.clientId);
    if (config.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, config.token);
    }
  }

  /**
   * 加载连接配置
   */
  public loadConnectionConfig(): ConnectionConfig {
    return {
      serverUrl:
        localStorage.getItem(STORAGE_KEYS.SERVER_URL) ||
        "http://127.0.0.1:30000",
      wsUrl: localStorage.getItem(STORAGE_KEYS.WS_URL) || undefined,
    };
  }

  /**
   * 保存连接配置
   */
  public saveConnectionConfig(config: ConnectionConfig): void {
    localStorage.setItem(STORAGE_KEYS.SERVER_URL, config.serverUrl);
    if (config.wsUrl) {
      localStorage.setItem(STORAGE_KEYS.WS_URL, config.wsUrl);
    }
  }

  /**
   * 清除所有配置
   */
  public clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}

// 单例导出
export const configManager = new ConfigManager();
