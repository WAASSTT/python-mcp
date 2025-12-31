export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '8002'),
  env: process.env.NODE_ENV || 'development',

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/xiaozhi',
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-here-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Redis 配置
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },

  // 文件上传配置
  upload: {
    maxSize: process.env.MAX_FILE_SIZE || '100MB',
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'audio/mpeg',
      'audio/wav',
    ],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // 验证码配置
  captcha: {
    expiresIn: 300, // 5分钟
  },

  // 短信配置
  sms: {
    codeLength: 6,
    expiresIn: 600, // 10分钟
    rateLimit: {
      maxAttempts: 5,
      window: 3600, // 1小时
    },
  },

  // LLM服务配置
  llm: {
    baseUrl: process.env.LLM_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.LLM_API_KEY || '',
    defaultModel: process.env.LLM_DEFAULT_MODEL || 'gpt-3.5-turbo',
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000'),
  },

  // MCP服务配置
  mcp: {
    baseUrl: process.env.MCP_SERVICE_URL || 'http://localhost:8081',
    timeout: parseInt(process.env.MCP_TIMEOUT || '10000'),
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    console: process.env.LOG_CONSOLE !== 'false',
    file: process.env.LOG_FILE !== 'false',
    dir: process.env.LOG_DIR || './logs',
  },

  // 速率限制
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1分钟
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 每个窗口最多100次请求
  },
};
