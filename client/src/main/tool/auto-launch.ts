import AutoLaunch from 'auto-launch'
import { app } from 'electron'
import log from 'electron-log'

/**
 * 自启动管理结果接口
 */
export interface AutoLaunchResult {
  success: boolean
  changed: boolean
  message: string
}

/**
 * 获取自启动状态
 * @returns 是否已启用自启动
 */
export async function getAutoLaunchStatus(): Promise<boolean> {
  const autoLauncher = new AutoLaunch({
    name: app.getName(),
    path: process.execPath
  })

  try {
    const isEnabled = await autoLauncher.isEnabled()
    log.info(`当前自启动状态: ${isEnabled ? '已启用' : '未启用'}`)
    return isEnabled
  } catch (error) {
    log.error(`获取自启动状态时发生错误: ${error}`)
    return false
  }
}

/**
 * 设置应用开机自启动
 * @param enable 是否启用自启动，默认为true
 * @returns 操作结果
 */
export async function setupAutoLaunch(enable = true): Promise<AutoLaunchResult> {
  const autoLauncher = new AutoLaunch({
    name: app.getName(),
    path: process.execPath
  })

  try {
    const isEnabled = await autoLauncher.isEnabled()

    if (enable) {
      if (!isEnabled) {
        await autoLauncher.enable()
        log.info('自启动已启用')
        return {
          success: true,
          changed: true,
          message: '已启用自启动'
        }
      } else {
        log.info('自启动已经启用')
        return {
          success: true,
          changed: false,
          message: '自启动已经启用'
        }
      }
    } else {
      if (isEnabled) {
        await autoLauncher.disable()
        log.info('自启动已禁用')
        return {
          success: true,
          changed: true,
          message: '已禁用自启动'
        }
      } else {
        log.info('自启动已经禁用')
        return {
          success: true,
          changed: false,
          message: '自启动已经禁用'
        }
      }
    }
  } catch (error) {
    const errorMessage = `操作自启动状态时发生错误: ${error}`
    log.error(errorMessage)
    return {
      success: false,
      changed: false,
      message: errorMessage
    }
  }
}
