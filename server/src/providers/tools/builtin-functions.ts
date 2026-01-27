/**
 * 内置函数定义
 * 使用 defineFunction 方式注册，符合 Elysia 最佳实践
 */

import { Action, ToolType } from "./base";
import { defineFunction } from "./registry";

// ============================================
// 时间相关函数
// ============================================

export const getTimeFunction = defineFunction({
  name: "get_time",
  description: "获取当前时间，包括日期、时间、星期等信息",
  parameters: {
    type: "object",
    properties: {
      format: {
        type: "string",
        description: "时间格式：full（完整）、date（仅日期）、time（仅时间）",
        enum: ["full", "date", "time"],
      },
    },
  },
  type: ToolType.SERVER_PLUGIN,
  handler: async (_context, params: { format?: "full" | "date" | "time" }) => {
    const now = new Date();
    const format = params.format || "full";

    const weekdayMap: Record<number, string> = {
      0: "星期日",
      1: "星期一",
      2: "星期二",
      3: "星期三",
      4: "星期四",
      5: "星期五",
      6: "星期六",
    };

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");
    const weekday = weekdayMap[now.getDay()];

    let result = "";
    switch (format) {
      case "date":
        result = `${year}年${month}月${day}日 ${weekday}`;
        break;
      case "time":
        result = `${hour}:${minute}:${second}`;
        break;
      case "full":
      default:
        result = `${year}年${month}月${day}日 ${hour}:${minute}:${second} ${weekday}`;
        break;
    }

    return {
      action: Action.CONTINUE,
      response: result,
      data: {
        formatted: result,
        timestamp: now.getTime(),
        iso: now.toISOString(),
        year,
        month,
        day,
        hour,
        minute,
        second,
        weekday,
      },
    };
  },
});

// ============================================
// 对话控制函数
// ============================================

export const exitConversationFunction = defineFunction({
  name: "handle_exit",
  description: "处理用户的退出/结束意图，结束当前对话",
  parameters: {
    type: "object",
    properties: {},
  },
  type: ToolType.SYSTEM_CTL,
  handler: async () => {
    return {
      action: Action.BREAK,
      response: "好的，再见！有需要随时叫我哦~",
      shouldExit: true,
    };
  },
});

export const continueConversationFunction = defineFunction({
  name: "continue_chat",
  description: "继续正常对话，不执行特殊操作",
  parameters: {
    type: "object",
    properties: {},
  },
  type: ToolType.SERVER_PLUGIN,
  handler: async () => {
    return {
      action: Action.NONE,
      response: "",
    };
  },
});

// ============================================
// 角色切换函数
// ============================================

export const changeRoleFunction = defineFunction({
  name: "change_role",
  description: "切换 AI 助手的角色或人格",
  parameters: {
    type: "object",
    properties: {
      role: {
        type: "string",
        description: "角色类型：英语老师、机车女友、好奇小男孩",
        enum: ["英语老师", "机车女友", "好奇小男孩"],
      },
      role_name: {
        type: "string",
        description: "角色的名字",
      },
    },
    required: ["role", "role_name"],
  },
  type: ToolType.CHANGE_ROLE,
  handler: async (_context, params: { role: string; role_name: string }) => {
    // 角色提示词映射
    const rolePrompts: Record<string, string> = {
      英语老师: `你是一位专业的英语老师，名叫${params.role_name}。你热情耐心，善于用简单易懂的方式解释英语知识。在对话中会适当使用英语，并鼓励学生开口说英语。`,
      机车女友: `你是一个性格活泼、有点小傲娇的女孩，名叫${params.role_name}。说话有点小任性，偶尔会撒娇，但对喜欢的人很温柔。会用一些可爱的语气词。`,
      好奇小男孩: `你是一个充满好奇心的小男孩，名叫${params.role_name}。对世界上的一切都感到新奇，喜欢问"为什么"。说话天真可爱，会分享自己的小发现。`,
    };

    const prompt = rolePrompts[params.role];
    if (!prompt) {
      return {
        action: Action.ERROR,
        response: `未找到角色：${params.role}`,
      };
    }

    return {
      action: Action.CONTINUE,
      response: `好的，我现在是${params.role_name}了！`,
      updatePrompt: prompt,
      data: {
        role: params.role,
        roleName: params.role_name,
        newPrompt: prompt,
      },
    };
  },
});

// ============================================
// 音乐控制函数
// ============================================

export const playMusicFunction = defineFunction({
  name: "play_music",
  description: "播放音乐或控制音乐播放",
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        description: "操作类型：play（播放）、pause（暂停）、next（下一曲）、prev（上一曲）",
        enum: ["play", "pause", "next", "prev"],
      },
      song: {
        type: "string",
        description: "歌曲名称或歌手名称（action 为 play 时需要）",
      },
    },
    required: ["action"],
  },
  type: ToolType.SYSTEM_CTL,
  handler: async (context, params: { action: string; song?: string }) => {
    const { action, song } = params;

    const actionMessages: Record<string, string> = {
      play: song ? `正在为你播放：${song}` : "请告诉我要播放什么歌曲",
      pause: "已暂停播放",
      next: "已切换到下一曲",
      prev: "已切换到上一曲",
    };

    const message = actionMessages[action] || `未知操作：${action}`;

    // 如果有连接上下文，发送 IoT 命令
    if (context.conn?.send) {
      context.conn.send({
        type: "music_control",
        data: { action, song },
      });
    }

    return {
      action: Action.CONTINUE,
      response: message,
      data: { action, song },
    };
  },
});

// ============================================
// 上下文查询函数
// ============================================

export const resultForContextFunction = defineFunction({
  name: "result_for_context",
  description: "需要结合当前时间等上下文信息回答用户问题",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "用户的原始问题",
      },
    },
    required: ["query"],
  },
  type: ToolType.SERVER_PLUGIN,
  handler: async (_context, params: { query: string }) => {
    const now = new Date();

    const weekdayMap: Record<number, string> = {
      0: "星期日",
      1: "星期一",
      2: "星期二",
      3: "星期三",
      4: "星期四",
      5: "星期五",
      6: "星期六",
    };

    const contextInfo = {
      currentTime: now.toLocaleTimeString("zh-CN"),
      todayDate: now.toLocaleDateString("zh-CN"),
      weekday: weekdayMap[now.getDay()],
      query: params.query,
    };

    return {
      action: Action.REQLLM,
      response: JSON.stringify(contextInfo),
      data: contextInfo,
    };
  },
});

// ============================================
// 导出所有内置函数
// ============================================

export const builtinFunctions = [
  getTimeFunction,
  exitConversationFunction,
  continueConversationFunction,
  changeRoleFunction,
  playMusicFunction,
  resultForContextFunction,
];
