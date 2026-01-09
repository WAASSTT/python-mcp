import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
  checkUpdate: () => {
    ipcRenderer.send("check-update");
  },
  downloadUpdate: () => {
    ipcRenderer.send("download-update");
  },
  installUpdate: () => {
    ipcRenderer.send("install-update");
  },
  updateAvailable: async (func: (event: any, args: any) => void) => {
    ipcRenderer.on("update-available", (event, args) => func(event, args));
  },
  downloadProgress: async (func: (event: any, args: any) => void) => {
    ipcRenderer.on("download-progress", (event, args) => func(event, args));
  },
  updateDownloaded: async (func: () => void) => {
    ipcRenderer.on("update-downloaded", () => func());
  },
  setLocale: (locale: string) => {
    ipcRenderer.send("set-locale", locale);
  },
  // 自启动相关 API
  getAutoLaunchStatus: (): Promise<boolean> => {
    return ipcRenderer.invoke("get-auto-launch-status");
  },
  setAutoLaunch: (
    enable: boolean
  ): Promise<{ success: boolean; changed: boolean; message: string }> => {
    return ipcRenderer.invoke("set-auto-launch", enable);
  },
  // 关闭到托盘行为控制 API
  getCloseToTray: (): Promise<boolean> => {
    return ipcRenderer.invoke("get-close-to-tray");
  },
  setCloseToTray: (
    enable: boolean
  ): Promise<{ success: boolean; closeToTray: boolean }> => {
    return ipcRenderer.invoke("set-close-to-tray", enable);
  },
  // 文件保存相关 API
  showSaveDialog: (options: any): Promise<any> => {
    return ipcRenderer.invoke("show-save-dialog", options);
  },
  saveFile: (filePath: string, data: Uint8Array): Promise<void> => {
    return ipcRenderer.invoke("save-file", filePath, Buffer.from(data));
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
    contextBridge.exposeInMainWorld("electronAPI", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI;
  // @ts-expect-error (define in dts)
  window.api = api;
  // @ts-expect-error (define in dts)
  window.electronAPI = api;
}
