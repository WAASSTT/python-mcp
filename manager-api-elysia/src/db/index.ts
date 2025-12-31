import { config } from '@/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// 创建 PostgreSQL 连接
const client = postgres(config.database.url);

// 创建 Drizzle ORM 实例
export const db = drizzle(client);

export * from './schema';
