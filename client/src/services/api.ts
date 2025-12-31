/**
 * API 服务
 * 处理 HTTP 请求，如 OTA 接口、视觉分析接口等
 */

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

export class ApiService {
  private baseUrl: string = '';

  /**
   * 设置基础 URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * 发起 GET 请求
   */
  // @ts-ignore - 保留用于未来可能的 GET 请求
  private async get<T>(url: string, timeout: number = 10000): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      console.error('[API] GET 请求失败:', error);
      throw error;
    }
  }

  /**
   * 发起 POST 请求
   * @private
   */
  private async post<T>(
    url: string,
    data?: any,
    headers?: Record<string, string>,
    timeoutMs: number = 10000
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接');
      }
      console.error('[API] POST 请求失败:', error);
      throw error;
    }
  }

  /**
   * 获取 OTA 配置
   * 参考：https://github.com/xinnan-tech/xiaozhi-esp32-server/tree/main/main/xiaozhi-server/test/js/core/network/ota-connector.js
   * 服务器 CORS 只允许: client-id, content-type, device-id, authorization
   */
  async getOTAConfig(
    deviceId: string,
    clientId: string,
    deviceModel: string = 'xiaozhi-web-client',
    deviceVersion: string = '1.0.0',
    token?: string
  ): Promise<OTAResponse> {
    console.log('[API] 获取 OTA 配置:', this.baseUrl);

    // 构造请求头 - 只包含服务器 CORS 允许的字段
    const headers: Record<string, string> = {
      'Device-Id': deviceId, // 注意大小写：Device-Id
      'Client-Id': clientId, // 注意大小写：Client-Id
    };

    // 如果有 token，添加到请求头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`; // 注意大小写：Authorization
    }

    // 构造请求体 - 完全按照 xiaozhi-esp32-server 测试页面的格式
    const requestBody = {
      version: 0,
      uuid: '',
      application: {
        name: deviceModel,
        version: deviceVersion,
        compile_time: new Date().toISOString(),
        idf_version: '1.0.0',
        elf_sha256: '0000000000000000000000000000000000000000000000000000000000000000',
      },
      ota: {
        label: deviceModel,
      },
      board: {
        type: deviceModel,
        ssid: 'web-client',
        rssi: 0,
        channel: 0,
        ip: '127.0.0.1',
        mac: deviceId,
      },
      flash_size: 0,
      minimum_free_heap_size: 0,
      mac_address: deviceId,
      chip_model_name: 'web-browser',
      chip_info: {
        model: 0,
        cores: 1,
        revision: 0,
        features: 0,
      },
      partition_table: [
        {
          label: '',
          type: 0,
          subtype: 0,
          address: 0,
          size: 0,
        },
      ],
    };

    console.log('[API] 请求头:', headers);
    console.log('[API] 请求体:', requestBody);

    return await this.post<OTAResponse>(this.baseUrl, requestBody, headers);
  }

  /**
   * 上传图片进行视觉分析
   */
  async analyzeVision(imageData: Blob, token: string): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageData);

    try {
      const response = await fetch(
        `${this.baseUrl.replace('/xiaozhi/ota/', '')}/mcp/vision/explain`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[API] 视觉分析失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const apiService = new ApiService();
