import { bearer } from '@elysiajs/bearer';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { staticPlugin } from '@elysiajs/static';
import { Elysia } from 'elysia';
import { logger } from 'elysia-logger';

// 导入模块路由
import { agentRoutes } from './modules/agent';
import { agentAdvancedRoutes } from './modules/agent/advanced';
import { chatHistoryRoutes } from './modules/agent/chat-history';
import { agentMcpRoutes } from './modules/agent/mcp';
import { agentTemplateRoutes } from './modules/agent/template';
import { agentVoicePrintRoutes } from './modules/agent/voiceprint';
import { configRoutes } from './modules/config';
import { deviceRoutes } from './modules/device';
import { deviceBindingRoutes } from './modules/device/binding';
import { otaRoutes } from './modules/device/ota';
import { knowledgeRoutes } from './modules/knowledge';
import { knowledgeBaseRoutes } from './modules/knowledge/base';
import { knowledgeFileRoutes } from './modules/knowledge/files';
import { llmRoutes } from './modules/llm';
import { modelRoutes } from './modules/model';
import { modelProviderRoutes } from './modules/model/provider';
import { securityRoutes } from './modules/security';
import { securityFullRoutes } from './modules/security/auth-full';
import { smsRoutes } from './modules/sms';
import { adminRoutes } from './modules/sys/admin';
import { dictDataRoutes, dictTypeRoutes } from './modules/sys/dict';
import { sysRoutes } from './modules/sys/index-full';
import { paramsRoutes } from './modules/sys/params';
import { serverManageRoutes } from './modules/sys/server-manage';
import { timbreRoutes } from './modules/timbre/index-full';
import { voiceCloneRoutes, voiceResourceRoutes } from './modules/voiceclone/clone';
import { voiceResourceFullRoutes } from './modules/voiceclone/resource';

// 导入配置
import { config } from './config';

// 导入中间件
import { errorHandler } from './common/middleware/error-handler';

const app = new Elysia()
  // 基础配置
  .use(
    cors({
      origin: true,
      credentials: true,
    })
  )

  // OpenAPI 文档
  .use(
    openapi({
      documentation: {
        info: {
          title: '小智后台管理系统 API',
          version: '1.0.0',
          description: '基于 Elysia 的小智后台管理系统 API 文档',
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: '开发环境',
          },
        ],
        tags: [
          { name: '登录管理', description: '用户登录和认证相关接口' },
          { name: '智能体管理', description: '智能体相关操作' },
          { name: '系统管理', description: '系统配置和管理' },
          { name: '管理员功能', description: '管理员后台功能' },
          { name: '服务器管理', description: '服务器端管理功能' },
          { name: '字典类型管理', description: '数据字典类型管理' },
          { name: '字典数据管理', description: '数据字典数据管理' },
          { name: '参数管理', description: '系统参数配置管理' },
          { name: '设备管理', description: '设备相关操作' },
          { name: '知识库管理', description: '知识库相关操作' },
          { name: '模型管理', description: 'AI模型相关操作' },
          { name: '模型供应器', description: '模型供应器管理' },
          { name: 'LLM服务', description: 'LLM服务相关接口' },
          { name: '配置管理', description: '系统配置' },
          { name: '音色管理', description: '音色相关操作' },
          { name: '声音克隆', description: '声音克隆相关操作' },
          { name: '声音资源', description: '声音资源管理' },
        ],
      },
      path: '/doc',
    })
  )

  // Bearer 认证支持
  .use(bearer())

  // 静态文件服务
  .use(
    staticPlugin({
      assets: 'public',
      prefix: '/static',
    })
  )

  // 全局中间件
  .use(logger())
  .use(errorHandler)

  // 健康检查
  .get(
    '/health',
    () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ['系统'],
        summary: '健康检查',
      },
    }
  )

  // 根路径
  .get('/', () => ({
    message: '小智后台管理系统 API',
    version: '1.0.0',
    documentation: '/doc',
  }))

  // 注册模块路由
  .use(securityRoutes)
  .use(securityFullRoutes)
  .use(smsRoutes)
  .use(adminRoutes)
  .use(dictTypeRoutes)
  .use(dictDataRoutes)
  .use(paramsRoutes)
  .use(serverManageRoutes)
  .use(agentRoutes)
  .use(agentAdvancedRoutes)
  .use(agentMcpRoutes)
  .use(agentTemplateRoutes)
  .use(agentVoicePrintRoutes)
  .use(chatHistoryRoutes)
  .use(sysRoutes)
  .use(deviceRoutes)
  .use(deviceBindingRoutes)
  .use(otaRoutes)
  .use(knowledgeRoutes)
  .use(knowledgeBaseRoutes)
  .use(knowledgeFileRoutes)
  .use(llmRoutes)
  .use(modelRoutes)
  .use(modelProviderRoutes)
  .use(configRoutes)
  .use(timbreRoutes)
  .use(voiceCloneRoutes)
  .use(voiceResourceRoutes)
  .use(voiceResourceFullRoutes);

export default app;
