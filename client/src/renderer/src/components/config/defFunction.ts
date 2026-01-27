/**
 * 检测是否运行在 Electron 环境中
 * 支持多种检测方式，确保在不同配置下都能准确识别
 * @returns {boolean} 是否为 Electron 环境
 */
const isElectron = (): boolean => {
  // ========================================================================
  // 方法1: 检查 process.versions.electron (最可靠，Electron 官方推荐)
  // ========================================================================
  // 适用于：主进程、启用 nodeIntegration 的渲染进程
  if (typeof process !== "undefined" && process.versions?.electron) {
    return true;
  }

  // ========================================================================
  // 方法2: 检查 process.type (Electron 进程类型)
  // ========================================================================
  // 适用于：主进程 (browser) 或渲染进程 (renderer)
  if (typeof process !== "undefined" && typeof process.type === "string") {
    if (process.type === "renderer" || process.type === "browser") {
      return true;
    }
  }

  // ========================================================================
  // 方法3: 检查 navigator.userAgent (浏览器标识)
  // ========================================================================
  // 适用于：所有渲染进程（包括禁用 nodeIntegration 的场景）
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string"
  ) {
    const ua = navigator.userAgent.toLowerCase();
    // 匹配 "Electron/版本号" 或 "electron" 关键字
    if (ua.includes("electron")) {
      return true;
    }
  }

  // ========================================================================
  // 方法4: 检查 window 对象上的 Electron 相关属性
  // ========================================================================
  // 适用于：通过 preload 脚本暴露 API 的场景
  if (typeof window !== "undefined") {
    const win = window as any;

    // 检查常见的 Electron API 暴露方式
    if (win.electron || win.electronAPI || win.__isElectronApp) {
      return true;
    }

    // 检查是否有 require 函数（启用 nodeIntegration 时）
    if (typeof win.require === "function") {
      try {
        // 尝试加载 electron 模块
        const electron = win.require("electron");
        if (electron) return true;
      } catch {
        // 非 Electron 环境或禁用了 nodeIntegration，忽略错误
      }
    }
  }

  // 所有检测方法都失败，非 Electron 环境
  return false;
};

const getBrowserEnv = () => {
  const ua = navigator.userAgent;
  const envInfo = {
    isQQBrowser: ua.indexOf("MQQBrowser") > -1, // QQ浏览器(手机上的)
    isWeChat: ua.indexOf("MicroMessenger") > -1, // 微信
    isQQ: /\sQQ/i.test(ua), // QQ App内置浏览器（需要配合使用）
    isWeibo: /WeiBo/i.test(ua), // 微博
    // 是否是 iOS 或 Android 的 WebView
    isWebView:
      /; wv\)/.test(ua) ||
      /Version\/[\d.]+ Mobile\/\w+ Safari\/[\d.]+/.test(ua),
    // 提取其他信息
    ua: ua,
  };
  console.log("浏览器环境信息:", envInfo);

  // 检测是否是内置浏览器
  let inBrowser = false;
  if (
    envInfo.isWeChat ||
    envInfo.isQQBrowser ||
    envInfo.isQQ ||
    envInfo.isWeibo ||
    envInfo.isWebView
  ) {
    inBrowser = true;
  }

  return inBrowser;
};

export { isElectron, getBrowserEnv };
