/**
 * 日志记录模块
 */

export type LogType = "info" | "error" | "debug" | "warning" | "success";

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: LogType;
}

class Logger {
  private listeners: Array<(entry: LogEntry) => void> = [];

  /**
   * 注册日志监听器
   */
  public onLog(callback: (entry: LogEntry) => void): void {
    this.listeners.push(callback);
  }

  /**
   * 记录日志
   */
  public log(message: string, type: LogType = "info"): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      message,
      type,
    };

    // 控制台输出
    const timestamp = this.formatTimestamp(entry.timestamp);
    const prefix = `[${timestamp}]`;

    switch (type) {
      case "error":
        console.error(prefix, message);
        break;
      case "warning":
        console.warn(prefix, message);
        break;
      case "debug":
        console.debug(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }

    // 通知所有监听器
    this.listeners.forEach((listener) => listener(entry));
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(date: Date): string {
    const time = date.toLocaleTimeString();
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    return `${time}.${ms}`;
  }

  /**
   * 便捷方法
   */
  public info(message: string): void {
    this.log(message, "info");
  }

  public error(message: string): void {
    this.log(message, "error");
  }

  public debug(message: string): void {
    this.log(message, "debug");
  }

  public warning(message: string): void {
    this.log(message, "warning");
  }

  public success(message: string): void {
    this.log(message, "success");
  }
}

// 单例导出
export const logger = new Logger();
