import {
  bigint,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * 系统用户表
 */
export const users = pgTable('sys_user', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  password: varchar('password', { length: 100 }),
  realName: varchar('real_name', { length: 50 }),
  email: varchar('email', { length: 100 }),
  mobile: varchar('mobile', { length: 20 }),
  roleId: varchar('role_id', { length: 32 }),
  superAdmin: integer('super_admin'), // 0: 否, 1: 是
  status: integer('status'), // 0: 停用, 1: 正常
  createDate: timestamp('create_date'),
  updateDate: timestamp('update_date'),
  creator: bigint('creator', { mode: 'number' }),
  updater: bigint('updater', { mode: 'number' }),
});

/**
 * 系统用户Token表
 */
export const userTokens = pgTable('sys_user_token', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }).notNull(),
  token: varchar('token', { length: 100 }).notNull().unique(),
  expireDate: timestamp('expire_date'),
  updateDate: timestamp('update_date'),
  createDate: timestamp('create_date'),
});

/**
 * 参数管理表
 */
export const sysParams = pgTable('sys_params', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  paramCode: varchar('param_code', { length: 32 }).unique(),
  paramValue: varchar('param_value', { length: 2000 }),
  paramType: integer('param_type').default(1), // 0: 系统参数, 1: 非系统参数
  remark: varchar('remark', { length: 200 }),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 字典类型表
 */
export const dictTypes = pgTable('sys_dict_type', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  dictType: varchar('dict_type', { length: 100 }).notNull().unique(),
  dictName: varchar('dict_name', { length: 255 }).notNull(),
  remark: varchar('remark', { length: 255 }),
  sort: integer('sort'),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 字典数据表
 */
export const dictData = pgTable('sys_dict_data', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  dictTypeId: bigint('dict_type_id', { mode: 'number' }).notNull(),
  dictLabel: varchar('dict_label', { length: 255 }).notNull(),
  dictValue: varchar('dict_value', { length: 255 }),
  remark: varchar('remark', { length: 255 }),
  sort: integer('sort'),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 模型供应器表
 */
export const modelProviders = pgTable('ai_model_provider', {
  id: varchar('id', { length: 32 }).primaryKey(),
  modelType: varchar('model_type', { length: 20 }), // Memory/ASR/VAD/LLM/TTS
  providerCode: varchar('provider_code', { length: 50 }),
  name: varchar('name', { length: 50 }),
  fields: jsonb('fields'),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 模型配置表
 */
export const models = pgTable('ai_model_config', {
  id: varchar('id', { length: 32 }).primaryKey(),
  modelType: varchar('model_type', { length: 20 }), // Memory/ASR/VAD/LLM/TTS
  modelCode: varchar('model_code', { length: 50 }),
  modelName: varchar('model_name', { length: 50 }),
  isDefault: integer('is_default').default(0), // 0: 否, 1: 是
  isEnabled: integer('is_enabled').default(0), // 0: 禁用, 1: 启用
  configJson: jsonb('config_json'),
  docLink: varchar('doc_link', { length: 200 }),
  remark: varchar('remark', { length: 255 }),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * TTS 音色表
 */
export const timbres = pgTable('ai_tts_voice', {
  id: varchar('id', { length: 32 }).primaryKey(),
  ttsModelId: varchar('tts_model_id', { length: 32 }),
  name: varchar('name', { length: 20 }),
  ttsVoice: varchar('tts_voice', { length: 50 }),
  languages: varchar('languages', { length: 50 }),
  voiceDemo: varchar('voice_demo', { length: 500 }),
  referenceAudio: varchar('reference_audio', { length: 500 }),
  referenceText: varchar('reference_text', { length: 500 }),
  remark: varchar('remark', { length: 255 }),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 智能体配置模板表
 */
export const agentTemplates = pgTable('ai_agent_template', {
  id: varchar('id', { length: 32 }).primaryKey(),
  agentCode: varchar('agent_code', { length: 36 }),
  agentName: varchar('agent_name', { length: 64 }),
  asrModelId: varchar('asr_model_id', { length: 32 }),
  vadModelId: varchar('vad_model_id', { length: 64 }),
  llmModelId: varchar('llm_model_id', { length: 32 }),
  vllmModelId: varchar('vllm_model_id', { length: 32 }),
  ttsModelId: varchar('tts_model_id', { length: 32 }),
  ttsVoiceId: varchar('tts_voice_id', { length: 32 }),
  memModelId: varchar('mem_model_id', { length: 32 }),
  intentModelId: varchar('intent_model_id', { length: 32 }),
  chatHistoryConf: integer('chat_history_conf'), // 0: 不记录, 1: 仅记录文本, 2: 记录文本和语音
  systemPrompt: text('system_prompt'),
  summaryMemory: text('summary_memory'),
  langCode: varchar('lang_code', { length: 10 }),
  language: varchar('language', { length: 10 }),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createdAt: timestamp('created_at'),
  updater: bigint('updater', { mode: 'number' }),
  updatedAt: timestamp('updated_at'),
});

/**
 * 智能体配置表
 */
export const agents = pgTable('ai_agent', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }),
  agentCode: varchar('agent_code', { length: 36 }),
  agentName: varchar('agent_name', { length: 64 }),
  asrModelId: varchar('asr_model_id', { length: 32 }),
  vadModelId: varchar('vad_model_id', { length: 64 }),
  llmModelId: varchar('llm_model_id', { length: 32 }),
  vllmModelId: varchar('vllm_model_id', { length: 32 }),
  ttsModelId: varchar('tts_model_id', { length: 32 }),
  ttsVoiceId: varchar('tts_voice_id', { length: 32 }),
  memModelId: varchar('mem_model_id', { length: 32 }),
  intentModelId: varchar('intent_model_id', { length: 32 }),
  chatHistoryConf: integer('chat_history_conf'), // 0: 不记录, 1: 仅记录文本, 2: 记录文本和语音
  systemPrompt: text('system_prompt'),
  summaryMemory: text('summary_memory'),
  langCode: varchar('lang_code', { length: 10 }),
  language: varchar('language', { length: 10 }),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createdAt: timestamp('created_at'),
  updater: bigint('updater', { mode: 'number' }),
  updatedAt: timestamp('updated_at'),
});

/**
 * 设备信息表
 */
export const devices = pgTable('ai_device', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }),
  macAddress: varchar('mac_address', { length: 50 }),
  lastConnectedAt: timestamp('last_connected_at'),
  autoUpdate: integer('auto_update').default(0), // 0: 关闭, 1: 开启
  board: varchar('board', { length: 50 }),
  alias: varchar('alias', { length: 64 }),
  agentId: varchar('agent_id', { length: 32 }),
  appVersion: varchar('app_version', { length: 20 }),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 声纹识别表
 */
export const voiceprints = pgTable('ai_voiceprint', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 64 }),
  userId: bigint('user_id', { mode: 'number' }),
  agentId: varchar('agent_id', { length: 32 }),
  agentCode: varchar('agent_code', { length: 36 }),
  agentName: varchar('agent_name', { length: 36 }),
  description: varchar('description', { length: 255 }),
  embedding: text('embedding'), // JSON 数组格式
  memory: text('memory'),
  sort: integer('sort').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createdAt: timestamp('created_at'),
  updater: bigint('updater', { mode: 'number' }),
  updatedAt: timestamp('updated_at'),
});

/**
 * 智能体声纹表
 */
export const agentVoicePrints = pgTable('ai_agent_voice_print', {
  id: varchar('id', { length: 32 }).primaryKey(),
  agentId: varchar('agent_id', { length: 32 }).notNull(),
  audioId: varchar('audio_id', { length: 32 }),
  sourceName: varchar('source_name', { length: 50 }).notNull(),
  introduce: varchar('introduce', { length: 200 }),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 对话历史表
 */
export const chatHistory = pgTable('ai_chat_history', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }),
  agentId: varchar('agent_id', { length: 32 }),
  deviceId: varchar('device_id', { length: 32 }),
  messageCount: integer('message_count'),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 对话信息表
 */
export const chatMessages = pgTable('ai_chat_message', {
  id: varchar('id', { length: 32 }).primaryKey(),
  userId: bigint('user_id', { mode: 'number' }),
  chatId: varchar('chat_id', { length: 64 }),
  role: varchar('role', { length: 20 }), // user, assistant
  content: text('content'),
  promptTokens: integer('prompt_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  promptMs: integer('prompt_ms').default(0),
  totalMs: integer('total_ms').default(0),
  completionMs: integer('completion_ms').default(0),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 智能体聊天记录表
 */
export const agentChatHistory = pgTable('ai_agent_chat_history', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  macAddress: varchar('mac_address', { length: 50 }),
  agentId: varchar('agent_id', { length: 32 }),
  sessionId: varchar('session_id', { length: 50 }),
  chatType: smallint('chat_type'), // 1: 用户, 2: 智能体
  content: varchar('content', { length: 1024 }),
  audioId: varchar('audio_id', { length: 32 }),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

/**
 * 智能体聊天音频数据表
 */
export const agentChatAudios = pgTable('ai_agent_chat_audio', {
  id: varchar('id', { length: 32 }).primaryKey(),
  audio: text('audio'), // LONGBLOB in MySQL, use text or bytea in PostgreSQL
});

/**
 * 智能体插件映射表
 */
export const agentPluginMappings = pgTable('ai_agent_plugin_mapping', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  agentId: varchar('agent_id', { length: 32 }),
  pluginId: varchar('plugin_id', { length: 32 }),
  paramInfo: text('param_info'), // 插件参数(JSON格式)
});

/**
 * 声音克隆表
 */
export const voiceClones = pgTable('ai_voice_clone', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 64 }),
  modelId: varchar('model_id', { length: 32 }),
  voiceId: varchar('voice_id', { length: 32 }),
  userId: bigint('user_id', { mode: 'number' }),
  voice: text('voice'), // LONGBLOB in MySQL
  trainStatus: integer('train_status').default(0), // 0: 待训练, 1: 训练中, 2: 训练成功, 3: 训练失败
  trainError: varchar('train_error', { length: 255 }),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
});

/**
 * OTA 固件信息表
 */
export const otaPackages = pgTable('ai_ota', {
  id: varchar('id', { length: 32 }).primaryKey(),
  firmwareName: varchar('firmware_name', { length: 100 }),
  type: varchar('type', { length: 50 }),
  version: varchar('version', { length: 50 }),
  size: bigint('size', { mode: 'number' }),
  remark: varchar('remark', { length: 500 }),
  firmwarePath: varchar('firmware_path', { length: 255 }),
  sort: integer('sort').default(0),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
});

/**
 * 知识库表
 */
export const knowledgeBases = pgTable('ai_rag_dataset', {
  id: varchar('id', { length: 32 }).primaryKey(),
  datasetId: varchar('dataset_id', { length: 50 }),
  ragModelId: varchar('rag_model_id', { length: 32 }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: integer('status').default(1), // 0: 禁用, 1: 启用
  creator: bigint('creator', { mode: 'number' }),
  createdAt: timestamp('created_at'),
  updater: bigint('updater', { mode: 'number' }),
  updatedAt: timestamp('updated_at'),
});

/**
 * 知识库文件表
 */
export const knowledgeFiles = pgTable('ai_knowledge_file', {
  id: varchar('id', { length: 32 }).primaryKey(),
  knowledgeBaseId: varchar('knowledge_base_id', { length: 32 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  fileType: varchar('file_type', { length: 50 }),
  status: integer('status').default(1),
  processedAt: timestamp('processed_at'),
  errorMessage: text('error_message'),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 声音资源表
 */
export const voiceResources = pgTable('ai_voice_resource', {
  id: varchar('id', { length: 32 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  userId: bigint('user_id', { mode: 'number' }),
  platform: varchar('platform', { length: 50 }),
  voiceId: varchar('voice_id', { length: 100 }).notNull(),
  language: varchar('language', { length: 20 }),
  gender: varchar('gender', { length: 10 }),
  sampleUrl: varchar('sample_url', { length: 255 }),
  sort: integer('sort').default(0),
  config: jsonb('config'),
  status: integer('status').default(1),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 角色表 (如果需要)
 */
export const roles = pgTable('sys_role', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  remark: varchar('remark', { length: 200 }),
  permissions: text('permissions'),
  creator: bigint('creator', { mode: 'number' }),
  createDate: timestamp('create_date'),
  updater: bigint('updater', { mode: 'number' }),
  updateDate: timestamp('update_date'),
});

/**
 * 智能体上下文源配置表
 */
export const agentContextProviders = pgTable('ai_agent_context_provider', {
  id: varchar('id', { length: 32 }).primaryKey(),
  agentId: varchar('agent_id', { length: 32 }),
  contextProviders: jsonb('context_providers'), // 上下文源配置(JSON数组)
  creator: bigint('creator', { mode: 'number' }),
  createdAt: timestamp('created_at'),
  updater: bigint('updater', { mode: 'number' }),
  updatedAt: timestamp('updated_at'),
});
