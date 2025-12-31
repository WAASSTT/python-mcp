CREATE TABLE IF NOT EXISTS "ai_agent_chat_audio" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"audio" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agent_chat_history" (
	"id" bigint PRIMARY KEY NOT NULL,
	"mac_address" varchar(50),
	"agent_id" varchar(32),
	"session_id" varchar(50),
	"chat_type" smallint,
	"content" varchar(1024),
	"audio_id" varchar(32),
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agent_context_provider" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"agent_id" varchar(32),
	"context_providers" jsonb,
	"creator" bigint,
	"created_at" timestamp,
	"updater" bigint,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agent_plugin_mapping" (
	"id" bigint PRIMARY KEY NOT NULL,
	"agent_id" varchar(32),
	"plugin_id" varchar(32),
	"param_info" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agent_template" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"agent_code" varchar(36),
	"agent_name" varchar(64),
	"asr_model_id" varchar(32),
	"vad_model_id" varchar(64),
	"llm_model_id" varchar(32),
	"vllm_model_id" varchar(32),
	"tts_model_id" varchar(32),
	"tts_voice_id" varchar(32),
	"mem_model_id" varchar(32),
	"intent_model_id" varchar(32),
	"chat_history_conf" integer,
	"system_prompt" text,
	"summary_memory" text,
	"lang_code" varchar(10),
	"language" varchar(10),
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"created_at" timestamp,
	"updater" bigint,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agent_voice_print" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"agent_id" varchar(32) NOT NULL,
	"audio_id" varchar(32),
	"source_name" varchar(50) NOT NULL,
	"introduce" varchar(200),
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_agent" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"agent_code" varchar(36),
	"agent_name" varchar(64),
	"asr_model_id" varchar(32),
	"vad_model_id" varchar(64),
	"llm_model_id" varchar(32),
	"vllm_model_id" varchar(32),
	"tts_model_id" varchar(32),
	"tts_voice_id" varchar(32),
	"mem_model_id" varchar(32),
	"intent_model_id" varchar(32),
	"chat_history_conf" integer,
	"system_prompt" text,
	"summary_memory" text,
	"lang_code" varchar(10),
	"language" varchar(10),
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"created_at" timestamp,
	"updater" bigint,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_chat_history" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"agent_id" varchar(32),
	"device_id" varchar(32),
	"message_count" integer,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_chat_message" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"chat_id" varchar(64),
	"role" varchar(20),
	"content" text,
	"prompt_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"completion_tokens" integer DEFAULT 0,
	"prompt_ms" integer DEFAULT 0,
	"total_ms" integer DEFAULT 0,
	"completion_ms" integer DEFAULT 0,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_device" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"user_id" bigint,
	"mac_address" varchar(50),
	"last_connected_at" timestamp,
	"auto_update" integer DEFAULT 0,
	"board" varchar(50),
	"alias" varchar(64),
	"agent_id" varchar(32),
	"app_version" varchar(20),
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sys_dict_data" (
	"id" bigint PRIMARY KEY NOT NULL,
	"dict_type_id" bigint NOT NULL,
	"dict_label" varchar(255) NOT NULL,
	"dict_value" varchar(255),
	"remark" varchar(255),
	"sort" integer,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sys_dict_type" (
	"id" bigint PRIMARY KEY NOT NULL,
	"dict_type" varchar(100) NOT NULL,
	"dict_name" varchar(255) NOT NULL,
	"remark" varchar(255),
	"sort" integer,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp,
	CONSTRAINT "sys_dict_type_dict_type_unique" UNIQUE("dict_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_rag_dataset" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"dataset_id" varchar(50),
	"rag_model_id" varchar(32),
	"name" varchar(100) NOT NULL,
	"description" text,
	"status" integer DEFAULT 1,
	"creator" bigint,
	"created_at" timestamp,
	"updater" bigint,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_knowledge_file" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"knowledge_base_id" varchar(32) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(255) NOT NULL,
	"file_size" integer,
	"file_type" varchar(50),
	"status" integer DEFAULT 1,
	"processed_at" timestamp,
	"error_message" text,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_model_provider" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"model_type" varchar(20),
	"provider_code" varchar(50),
	"name" varchar(50),
	"fields" jsonb,
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_model_config" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"model_type" varchar(20),
	"model_code" varchar(50),
	"model_name" varchar(50),
	"is_default" integer DEFAULT 0,
	"is_enabled" integer DEFAULT 0,
	"config_json" jsonb,
	"doc_link" varchar(200),
	"remark" varchar(255),
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_ota" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"firmware_name" varchar(100),
	"type" varchar(50),
	"version" varchar(50),
	"size" bigint,
	"remark" varchar(500),
	"firmware_path" varchar(255),
	"sort" integer DEFAULT 0,
	"updater" bigint,
	"update_date" timestamp,
	"creator" bigint,
	"create_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sys_role" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"remark" varchar(200),
	"permissions" text,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sys_params" (
	"id" bigint PRIMARY KEY NOT NULL,
	"param_code" varchar(32),
	"param_value" varchar(2000),
	"param_type" integer DEFAULT 1,
	"remark" varchar(200),
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp,
	CONSTRAINT "sys_params_param_code_unique" UNIQUE("param_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_tts_voice" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"tts_model_id" varchar(32),
	"name" varchar(20),
	"tts_voice" varchar(50),
	"languages" varchar(50),
	"voice_demo" varchar(500),
	"reference_audio" varchar(500),
	"reference_text" varchar(500),
	"remark" varchar(255),
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sys_user_token" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token" varchar(100) NOT NULL,
	"expire_date" timestamp,
	"update_date" timestamp,
	"create_date" timestamp,
	CONSTRAINT "sys_user_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sys_user" (
	"id" bigint PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(100),
	"real_name" varchar(50),
	"email" varchar(100),
	"mobile" varchar(20),
	"role_id" varchar(32),
	"super_admin" integer,
	"status" integer,
	"create_date" timestamp,
	"update_date" timestamp,
	"creator" bigint,
	"updater" bigint,
	CONSTRAINT "sys_user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_voice_clone" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(64),
	"model_id" varchar(32),
	"voice_id" varchar(32),
	"user_id" bigint,
	"voice" text,
	"train_status" integer DEFAULT 0,
	"train_error" varchar(255),
	"creator" bigint,
	"create_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_voice_resource" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"user_id" bigint,
	"platform" varchar(50),
	"voice_id" varchar(100) NOT NULL,
	"language" varchar(20),
	"gender" varchar(10),
	"sample_url" varchar(255),
	"sort" integer DEFAULT 0,
	"config" jsonb,
	"status" integer DEFAULT 1,
	"creator" bigint,
	"create_date" timestamp,
	"updater" bigint,
	"update_date" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_voiceprint" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(64),
	"user_id" bigint,
	"agent_id" varchar(32),
	"agent_code" varchar(36),
	"agent_name" varchar(36),
	"description" varchar(255),
	"embedding" text,
	"memory" text,
	"sort" integer DEFAULT 0,
	"creator" bigint,
	"created_at" timestamp,
	"updater" bigint,
	"updated_at" timestamp
);
