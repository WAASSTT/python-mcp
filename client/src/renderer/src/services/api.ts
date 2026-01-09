/**
 * API 服务 - HTTP 请求
 */

export interface DeviceConfig {
  deviceId: string;
  deviceName: string;
  clientId: string;
  token: string;
}

export interface OTAResponse {
  server_time: {
    timestamp: number;
    timezone_offset: number;
  };
  firmware: {
    version: string;
    url: string;
  };
  websocket?: {
    url: string;
    token: string;
  };
  mqtt?: {
    endpoint: string;
    client_id: string;
    username: string;
    password: string;
    publish_topic: string;
    subscribe_topic: string;
  };
}

class APIService {
  private baseUrl = "";

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/ws$/, ""); // 移除 /ws 后缀
  }

  /**
   * 获取设备配置
   */
  async getDeviceConfig(): Promise<DeviceConfig> {
    const response = await fetch(`${this.baseUrl}/api/config`);
    return response.json();
  }

  /**
   * 获取 OTA 配置
   */
  async getOTAConfig(
    otaUrl: string,
    config: Partial<DeviceConfig>
  ): Promise<OTAResponse> {
    try {
      const response = await fetch(otaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 服务端从 headers 读取这些字段（严格按照服务端CORS配置）
          "device-id": config.deviceId || "",
          "client-id": config.clientId || "",
        },
        body: JSON.stringify(config),
      });
      return response.json();
    } catch (error) {
      // 返回一个最小的有效响应
      throw new Error(error instanceof Error ? error.message : "OTA请求失败");
    }
  }

  /**
   * 更新设备配置
   */
  async updateDeviceConfig(config: Partial<DeviceConfig>): Promise<void> {
    await fetch(`${this.baseUrl}/api/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  }

  /**
   * OTA 升级
   */
  async ota(firmwareUrl: string): Promise<OTAResponse> {
    const response = await fetch(`${this.baseUrl}/api/ota`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: firmwareUrl }),
    });
    return response.json();
  }

  /**
   * 获取系统信息
   */
  async getSystemInfo(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/api/system`);
    return response.json();
  }
}

// 单例导出
export const apiService = new APIService();
