/**
 * 内置 MCP 工具
 * 提供常用的系统工具
 */

import { McpBase, type McpContext, type McpResult, type McpToolDefinition } from "../mcp-base";

// ============= 天气查询工具 =============

/** 天气查询工具 */
export class WeatherTool extends McpBase {
  constructor(private config: { apiKey: string; apiHost: string }) {
    super();
  }

  get definition(): McpToolDefinition {
    return {
      name: "get_weather",
      description: "获取指定城市的天气信息",
      parameters: [
        {
          name: "location",
          type: "string",
          description: "城市名称，例如：北京、上海、无锡",
          required: true,
        },
        {
          name: "days",
          type: "number",
          description: "查询天数（1-7天），默认1天",
          default: 1,
        },
      ],
      examples: [
        {
          input: { location: "北京", days: 1 },
          output: { temperature: 25, condition: "晴" },
        },
      ],
    };
  }

  async execute(params: Record<string, unknown>, _context: McpContext): Promise<McpResult> {
    // 验证参数
    const errors = this.validateParams(params);
    if (errors.length > 0) {
      return this.failure(errors.join(", "));
    }

    const { location, days = 1 } = params;

    try {
      // 这里应该调用实际的天气 API
      // 示例返回模拟数据
      const weatherData = {
        location: location as string,
        days: days as number,
        forecast: [
          {
            date: new Date().toISOString(),
            temperature: 25,
            condition: "晴",
            humidity: 60,
          },
        ],
      };

      return this.success(weatherData);
    } catch (error) {
      return this.failure(
        `Failed to fetch weather: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// ============= 时间工具 =============

/** 时间查询工具 */
export class TimeTool extends McpBase {
  get definition(): McpToolDefinition {
    return {
      name: "get_time",
      description: "获取当前时间或指定时区的时间",
      parameters: [
        {
          name: "timezone",
          type: "string",
          description: "时区，例如：Asia/Shanghai、America/New_York",
          default: "Asia/Shanghai",
        },
        {
          name: "format",
          type: "string",
          description: "时间格式：iso（ISO8601）、timestamp（Unix时间戳）、readable（可读格式）",
          default: "readable",
        },
      ],
    };
  }

  async execute(params: Record<string, unknown>, _context: McpContext): Promise<McpResult> {
    const { timezone = "Asia/Shanghai", format = "readable" } = params;

    try {
      const now = new Date();
      let result: string | number;

      switch (format) {
        case "iso":
          result = now.toISOString();
          break;
        case "timestamp":
          result = now.getTime();
          break;
        case "readable":
        default:
          result = now.toLocaleString("zh-CN", { timeZone: timezone as string });
          break;
      }

      return this.success({
        timezone,
        format,
        time: result,
      });
    } catch (error) {
      return this.failure(
        `Failed to get time: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// ============= 计算器工具 =============

/** 计算器工具 */
export class CalculatorTool extends McpBase {
  get definition(): McpToolDefinition {
    return {
      name: "calculate",
      description: "执行数学计算",
      parameters: [
        {
          name: "expression",
          type: "string",
          description: "数学表达式，例如：2 + 2、10 * 5、sqrt(16)",
          required: true,
        },
      ],
      examples: [
        {
          input: { expression: "2 + 2" },
          output: { result: 4 },
        },
      ],
    };
  }

  async execute(params: Record<string, unknown>, _context: McpContext): Promise<McpResult> {
    const errors = this.validateParams(params);
    if (errors.length > 0) {
      return this.failure(errors.join(", "));
    }

    const { expression } = params;

    try {
      // 安全的数学表达式求值
      const result = this.evaluateExpression(expression as string);
      return this.success({ expression, result });
    } catch (error) {
      return this.failure(
        `Calculation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** 安全地求值数学表达式 */
  private evaluateExpression(expr: string): number {
    // 移除空格
    expr = expr.replace(/\s/g, "");

    // 仅允许数字、运算符和括号
    if (!/^[\d+\-*/().]+$/.test(expr)) {
      throw new Error("Invalid expression");
    }

    // 使用 Function 构造函数安全求值
    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${expr}`)() as number;
    } catch {
      throw new Error("Failed to evaluate expression");
    }
  }
}

// ============= 随机数生成工具 =============

/** 随机数生成工具 */
export class RandomTool extends McpBase {
  get definition(): McpToolDefinition {
    return {
      name: "random",
      description: "生成随机数或随机选择",
      parameters: [
        {
          name: "type",
          type: "string",
          description: "类型：number（随机数）、choice（随机选择）",
          required: true,
        },
        {
          name: "min",
          type: "number",
          description: "最小值（type=number时使用）",
        },
        {
          name: "max",
          type: "number",
          description: "最大值（type=number时使用）",
        },
        {
          name: "choices",
          type: "array",
          description: "选项数组（type=choice时使用）",
        },
      ],
    };
  }

  async execute(params: Record<string, unknown>, _context: McpContext): Promise<McpResult> {
    const { type, min, max, choices } = params;

    try {
      if (type === "number") {
        const minVal = (min as number) || 0;
        const maxVal = (max as number) || 100;
        const result = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        return this.success({ type: "number", value: result, min: minVal, max: maxVal });
      } else if (type === "choice") {
        if (!Array.isArray(choices) || choices.length === 0) {
          return this.failure("choices array is required and cannot be empty");
        }
        const result = choices[Math.floor(Math.random() * choices.length)];
        return this.success({ type: "choice", value: result, choices });
      } else {
        return this.failure(`Unknown type: ${type}`);
      }
    } catch (error) {
      return this.failure(
        `Random generation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// ============= UUID 生成工具 =============

/** UUID 生成工具 */
export class UuidTool extends McpBase {
  get definition(): McpToolDefinition {
    return {
      name: "generate_uuid",
      description: "生成UUID（通用唯一标识符）",
      parameters: [
        {
          name: "version",
          type: "string",
          description: "UUID版本：v4（随机）、v1（时间戳）",
          default: "v4",
        },
      ],
    };
  }

  async execute(params: Record<string, unknown>, _context: McpContext): Promise<McpResult> {
    const { version = "v4" } = params;

    try {
      const uuid = version === "v4" ? this.generateUUIDv4() : this.generateUUIDv1();

      return this.success({ uuid, version });
    } catch (error) {
      return this.failure(
        `UUID generation error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** 生成 UUID v4 */
  private generateUUIDv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /** 生成 UUID v1（简化版） */
  private generateUUIDv1(): string {
    const timestamp = Date.now();
    return `${timestamp.toString(16)}-xxxx-1xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// ============= 导出 =============

export const builtinTools = {
  WeatherTool,
  TimeTool,
  CalculatorTool,
  RandomTool,
  UuidTool,
} as const;

export default builtinTools;
