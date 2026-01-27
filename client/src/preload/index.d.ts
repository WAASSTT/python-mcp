import { ElectronAPI } from "@electron-toolkit/preload";

interface AutoLaunchResult {
  success: boolean;
  changed: boolean;
  message: string;
}

interface CloseToTrayResult {
  success: boolean;
  closeToTray: boolean;
}

interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

interface api {
  ping: () => void;
  checkUpdate: () => void;
  downloadUpdate: () => void;
  installUpdate: () => void;
  updateAvailable: (func: (event, args) => void) => void;
  downloadProgress: (func: (event, args) => void) => void;
  updateDownloaded: (func: () => void) => void;
  setLocale: (locale: string) => void;
  getAutoLaunchStatus: () => Promise<boolean>;
  setAutoLaunch: (enable: boolean) => Promise<AutoLaunchResult>;
  getCloseToTray: () => Promise<boolean>;
  setCloseToTray: (enable: boolean) => Promise<CloseToTrayResult>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogResult>;
  saveFile: (filePath: string, data: Uint8Array) => Promise<void>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    api: api;
    electronAPI: api;
  }
}
