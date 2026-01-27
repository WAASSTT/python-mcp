import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} from "electron";
import log from "electron-log";
import pkg from "electron-updater";
import { writeFile } from "fs/promises";
import { join } from "path";
import { setLocale, t } from "./lang";

import { getAutoLaunchStatus, setupAutoLaunch } from "./tool/auto-launch";
const { autoUpdater } = pkg;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false; // 应用是否正在退出
let closeToTray = true; // 关闭按钮是否最小化到托盘

// 窗口管理函数
function showWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function hideWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  // 所有平台都使用 hide() 来隐藏窗口到托盘
  // hide() 会完全隐藏窗口（不显示在任务栏）
  // minimize() 会最小化到任务栏
  mainWindow.hide();
}

function quitApp(): void {
  isQuitting = true;

  // 销毁主窗口
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }

  app.quit();
}

// 获取图标路径（根据平台和用途）
function getIconPath(type: "app" | "tray" = "app"): string {
  const resourcesPath = join(__dirname, "../../resources");
  switch (process.platform) {
    case "win32":
      return join(resourcesPath, "icon.ico");
    case "darwin":
      // macOS 应用图标使用 .icns，托盘图标使用专用的 16x16/32x32 PNG
      if (type === "tray") {
        // 使用 Retina 版本（32x32），系统会自动处理缩放
        return join(resourcesPath, "trayIcon@2x.png");
      }
      return join(resourcesPath, "icon.icns");
    default: // linux
      return join(resourcesPath, "icon.png");
  }
}

function createWindow(): void {
  // Create the browser window.
  const iconPath = getIconPath("app");
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
    icon: nativeImage.createFromPath(iconPath),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false, // 关闭沙箱以便使用 node.js 模块
    },
  });

  autoUpdater.autoDownload = false; //关闭自动下载更新
  autoUpdater.forceDevUpdateConfig = false; //强制使用开发环境更新
  log.transports.file.level = "debug";
  autoUpdater.logger = log;
  //打开开发者工具
  // mainWindow.webContents.openDevTools()

  // 处理跨域问题
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      callback({ requestHeaders: { Origin: "*", ...details.requestHeaders } });
    }
  );
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          "Access-Control-Allow-Origin": ["*"],
          ...details.responseHeaders,
        },
      });
    }
  );

  mainWindow.on("ready-to-show", () => {
    showWindow();
  });

  // 窗口关闭时触发
  mainWindow.on("close", (event) => {
    // 如果应用正在退出，允许窗口关闭
    if (isQuitting) {
      return;
    }

    // 阻止窗口关闭
    event.preventDefault();

    if (closeToTray) {
      // 隐藏到托盘
      hideWindow();
      log.info("窗口已最小化到托盘");
    } else {
      // 直接退出应用
      quitApp();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.webContents.session.setPermissionCheckHandler(
    (_webContents, permission, _requestingOrigin, details) => {
      console.log("[Main] 权限检查:", permission, details);

      // 允许麦克风和摄像头权限
      if (permission === "media") {
        return true;
      }

      if (permission === "hid" && details.securityOrigin === "file:///") {
        return true;
      }
      return true;
    }
  );

  // 设置权限请求处理器（用户请求权限时）
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      console.log("[Main] 权限请求:", permission);

      // 自动允许麦克风和摄像头权限
      if (permission === "media") {
        console.log("[Main] ✅ 允许媒体权限:", permission);
        callback(true);
        return;
      }

      // 默认允许所有权限（开发环境）
      callback(true);
    }
  );

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === "hid" && details.origin === "file://") {
      return true;
    }
    return true;
  });

  mainWindow.webContents.session.on(
    "select-hid-device",
    (event, details, callback) => {
      event.preventDefault();
      if (details.deviceList && details.deviceList.length > 0) {
        callback(details.deviceList[0].deviceId);
      }
    }
  );

  // HID 设备添加/移除事件应该在外部注册，避免重复监听
  mainWindow.webContents.session.on("hid-device-added", (_event, device) => {
    log.debug("hid-device-added FIRED WITH", device);
    // Optionally update details.deviceList
  });

  mainWindow.webContents.session.on("hid-device-removed", (_event, device) => {
    log.debug("hid-device-removed FIRED WITH", device);
    // Optionally update details.deviceList
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

//检查更新
const checkUpdates = () => {
  // const updateUrl = 'http://127.0.0.1:8080'
  // autoUpdater.setFeedURL(updateUrl)
  autoUpdater.checkForUpdates();
};

// 初始化自动更新事件监听器（只注册一次，避免重复注册）
const initAutoUpdater = () => {
  //更新错误
  autoUpdater.on("error", (error) => {
    log.error("Error fetching updates:", error);
  });

  //没有更新
  autoUpdater.on("update-not-available", () => {
    log.info("No updates available");
  });

  //有更新
  autoUpdater.on("update-available", (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-available", info);
    }
  });

  //下载进度
  autoUpdater.on("download-progress", (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("download-progress", progress);
    }
  });

  //更新下载完成
  autoUpdater.on("update-downloaded", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-downloaded");
    }
  });
};

//互斥 防止多个实例
const additionalData = { key: "demo" };
const gotTheLock = app.requestSingleInstanceLock(additionalData);
if (!gotTheLock) {
  // 如果获取不到锁，说明已经有一个实例在运行了，直接退出
  app.quit();
} else {
  app.on("second-instance", () => {
    // 当第二个实例启动时，显示主窗口
    showWindow();
  });
}

function createTray(): void {
  try {
    if (tray && !tray.isDestroyed()) {
      tray.destroy();
      tray = null;
    }

    const trayIconPath = getIconPath("tray");
    tray = new Tray(nativeImage.createFromPath(trayIconPath));

    if (!tray || tray.isDestroyed()) {
      log.error("托盘创建失败");
      return;
    }

    tray.setToolTip(t("tray.tooltip"));

    // 根据平台创建不同的菜单
    const createContextMenu = () => {
      const menuTemplate =
        process.platform === "linux"
          ? [
              {
                label: t("tray.showWindow"),
                click: showWindow,
              },
              {
                type: "separator" as const,
              },
              {
                label: t("tray.quit"),
                click: quitApp,
              },
            ]
          : [
              {
                label: t("tray.quit"),
                click: quitApp,
              },
            ];

      return Menu.buildFromTemplate(menuTemplate);
    };

    // Linux 需要使用 setContextMenu 确保右键菜单可用
    if (process.platform === "linux") {
      tray.setContextMenu(createContextMenu());
    }

    // 单击托盘图标 - 显示/隐藏窗口
    tray.on("click", () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;

      if (mainWindow.isVisible()) {
        hideWindow();
      } else {
        showWindow();
      }
    });

    // 右键点击 - 显示菜单（Windows 和 macOS）
    if (process.platform !== "linux") {
      tray.on("right-click", () => {
        if (!tray || tray.isDestroyed()) return;
        const contextMenu = createContextMenu();
        tray.popUpContextMenu(contextMenu);
      });
    }
  } catch (error) {
    log.error("创建托盘时发生错误:", error);
    tray = null;
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.electron");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  //ipcMain.on是用于监听渲染进程发送的事件 ipcMain.handle 是用于监听渲染进程发送的请求
  //ipcMain.handle是用于监听渲染进程发送的请求 要求返回一个 Promise 对象 与 ipcRenderer.invoke 配合使用
  // ipcMain.on是用于监听渲染进程发送的事件 不需要返回值  与 ipcRenderer.send 配合使用
  // IPC test
  ipcMain.on("ping", () => console.log("pong")); // 监听 ping 事件并打印 pong

  // 文件保存对话框
  ipcMain.handle("show-save-dialog", async (_event, options) => {
    if (!mainWindow) return { canceled: true };
    return await dialog.showSaveDialog(mainWindow, options);
  });

  // 保存文件
  ipcMain.handle(
    "save-file",
    async (_event, filePath: string, data: Buffer) => {
      await writeFile(filePath, data);
    }
  );

  ipcMain.on("check-update", () => {
    checkUpdates();
  });

  ipcMain.on("download-update", () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on("install-update", () => {
    log.info("用户请求安装更新并重启");
    isQuitting = true;
    autoUpdater.quitAndInstall();
  });

  // 监听语言切换
  ipcMain.on("set-locale", (_event, locale: string) => {
    setLocale(locale);
    // 更新托盘提示文本，菜单会在右键点击时动态创建
    if (tray && !tray.isDestroyed()) {
      tray.setToolTip(t("tray.tooltip"));

      // Linux 需要更新 contextMenu
      if (process.platform === "linux") {
        const menuTemplate = [
          {
            label: t("tray.showWindow"),
            click: showWindow,
          },
          {
            type: "separator" as const,
          },
          {
            label: t("tray.quit"),
            click: quitApp,
          },
        ];

        const contextMenu = Menu.buildFromTemplate(menuTemplate);
        tray.setContextMenu(contextMenu);
      }
    }
  });

  // 处理自启动相关的 IPC 请求
  ipcMain.handle("get-auto-launch-status", async () => {
    return await getAutoLaunchStatus();
  });

  ipcMain.handle("set-auto-launch", async (_event, enable: boolean) => {
    return await setupAutoLaunch(enable);
  });

  // 处理关闭到托盘行为控制
  ipcMain.handle("get-close-to-tray", () => {
    return closeToTray;
  });

  ipcMain.handle("set-close-to-tray", (_event, enable: boolean) => {
    closeToTray = enable;
    log.info(`关闭行为已更改: ${enable ? "最小化到托盘" : "直接退出"}`);
    return { success: true, closeToTray };
  });

  // 初始化自动更新监听器
  initAutoUpdater();

  // 确保托盘在应用准备好后立即创建
  try {
    createTray();
    log.info("托盘初始化完成");
  } catch (error) {
    log.error("创建托盘失败:", error);
  }

  createWindow();

  app.on("activate", () => {
    // macOS: 点击 Dock 图标时
    if (BrowserWindow.getAllWindows().length === 0) {
      // 如果没有窗口，创建新窗口
      createWindow();
    } else {
      // 如果有窗口，显示主窗口
      showWindow();
    }
  });
});

// 应用准备退出前触发（Cmd+Q, Dock右键退出等）
app.on("before-quit", () => {
  log.info("before-quit: 应用准备退出");
  isQuitting = true;

  // 销毁主窗口
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }

  // 清理托盘
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
});

// 所有窗口关闭时触发
app.on("window-all-closed", () => {
  // 如果是正在退出，直接退出应用
  // 否则保持应用运行（托盘模式）
  if (isQuitting) {
    app.quit();
  }
});

// 应用退出时的日志
app.on("will-quit", () => {
  log.info("应用正在退出");
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
