import { ToolType } from "@/providers/tools/base";
import type { ToolManager } from "@/providers/tools/manager";
import { Elysia, t } from "elysia";

/**
 * 工具管理 API 路由
 * 提供工具的查询、执行等接口
 */
export const toolsRoutes = new Elysia({ prefix: "/api/tools" })
  /**
   * 列出所有可用工具
   */
  .get(
    "/",
    async ({ store }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const tools = await toolManager.getAllTools();
      const toolList = Object.entries(tools).map(([name, def]) => ({
        name,
        type: def.toolType,
        description: def.description.function.description,
        parameters: def.description.function.parameters,
      }));

      return {
        success: true,
        data: {
          tools: toolList,
          total: toolList.length,
        },
      };
    },
    {
      detail: {
        tags: ["Tools"],
        summary: "列出所有工具",
        description: "获取所有已注册的工具列表及其定义",
      },
    },
  )

  /**
   * 获取工具统计信息
   */
  .get(
    "/stats",
    async ({ store }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const stats = await toolManager.getStats();

      return {
        success: true,
        data: stats,
      };
    },
    {
      detail: {
        tags: ["Tools"],
        summary: "获取工具统计",
        description: "获取工具的统计信息，包括总数和按类型分布",
      },
    },
  )

  /**
   * 获取工具定义（OpenAI 格式）
   */
  .get(
    "/definitions",
    async ({ store }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const definitions = await toolManager.getFunctionDescriptions();

      return {
        success: true,
        data: {
          definitions,
          total: definitions.length,
        },
      };
    },
    {
      detail: {
        tags: ["Tools"],
        summary: "获取工具定义",
        description: "获取所有工具的 OpenAI 格式函数定义，可直接用于 LLM 调用",
      },
    },
  )

  /**
   * 获取单个工具详情
   */
  .get(
    "/:name",
    async ({ params, store, set }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        set.status = 500;
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const tool = await toolManager.getToolInfo(params.name);
      if (!tool) {
        set.status = 404;
        return {
          success: false,
          error: `Tool ${params.name} not found`,
        };
      }

      return {
        success: true,
        data: {
          name: tool.name,
          type: tool.toolType,
          description: tool.description.function.description,
          parameters: tool.description.function.parameters,
        },
      };
    },
    {
      params: t.Object({
        name: t.String(),
      }),
      detail: {
        tags: ["Tools"],
        summary: "获取工具详情",
        description: "获取指定工具的详细信息",
      },
    },
  )

  /**
   * 执行工具调用
   */
  .post(
    "/execute",
    async ({ body, store, set }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        set.status = 500;
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const { name, params = {}, sessionId, deviceId } = body;

      // 检查工具是否存在
      if (!(await toolManager.hasTool(name))) {
        set.status = 404;
        return {
          success: false,
          error: `Tool ${name} not found`,
        };
      }

      // 构建上下文
      const context = {
        sessionId,
        deviceId,
        logger: (store as any).logger,
      };

      // 执行工具
      const result = await toolManager.executeTool(context, name, params);

      return {
        success: result.action !== "ERROR" && result.action !== "NOTFOUND",
        data: {
          action: result.action,
          response: result.response,
          data: result.data,
        },
      };
    },
    {
      body: t.Object({
        name: t.String(),
        params: t.Optional(t.Record(t.String(), t.Any())),
        sessionId: t.Optional(t.String()),
        deviceId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tools"],
        summary: "执行工具",
        description: "执行指定的工具并返回结果",
      },
    },
  )

  /**
   * 批量执行工具调用（模拟 LLM function call）
   */
  .post(
    "/execute-batch",
    async ({ body, store, set }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        set.status = 500;
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const { toolCalls, sessionId, deviceId } = body;

      // 构建上下文
      const context = {
        sessionId,
        deviceId,
        logger: (store as any).logger,
      };

      // 批量执行
      const results = await toolManager.executeToolCalls(context, toolCalls);

      return {
        success: true,
        data: {
          results: results.map((r) => ({
            id: r.id,
            action: r.result.action,
            response: r.result.response,
            data: r.result.data,
          })),
        },
      };
    },
    {
      body: t.Object({
        toolCalls: t.Array(
          t.Object({
            id: t.String(),
            function: t.Object({
              name: t.String(),
              arguments: t.String(),
            }),
          }),
        ),
        sessionId: t.Optional(t.String()),
        deviceId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Tools"],
        summary: "批量执行工具",
        description: "批量执行多个工具调用，支持 LLM function call 格式",
      },
    },
  )

  /**
   * 按类型筛选工具
   */
  .get(
    "/type/:type",
    async ({ params, store, set }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        set.status = 500;
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      const toolType = params.type as ToolType;
      const tools = await toolManager.getToolsByType(toolType);

      const toolList = Object.entries(tools).map(([name, def]) => ({
        name,
        type: def.toolType,
        description: def.description.function.description,
      }));

      return {
        success: true,
        data: {
          type: toolType,
          tools: toolList,
          total: toolList.length,
        },
      };
    },
    {
      params: t.Object({
        type: t.String(),
      }),
      detail: {
        tags: ["Tools"],
        summary: "按类型获取工具",
        description: "获取指定类型的所有工具",
      },
    },
  )

  /**
   * 刷新工具缓存
   */
  .post(
    "/refresh",
    async ({ store }: any) => {
      const toolManager = (store as any).toolManager as ToolManager;
      if (!toolManager) {
        return {
          success: false,
          error: "Tool manager not initialized",
        };
      }

      toolManager.refreshCache();

      return {
        success: true,
        message: "Tool cache refreshed",
      };
    },
    {
      detail: {
        tags: ["Tools"],
        summary: "刷新工具缓存",
        description: "刷新工具定义的缓存，重新加载所有工具",
      },
    },
  );
