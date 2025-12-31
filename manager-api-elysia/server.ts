/**
 * Server Entry Point
 *
 * This file is responsible for starting the Elysia server.
 * Follows official Elysia best practice: separate app definition from server startup.
 *
 * References:
 * - https://elysia.zhcndoc.com/patterns/deploy.html (集群模式示例)
 * - https://elysia.zhcndoc.com/at-glance.html (标准用法)
 */

import app from './src/index';

// Start the server
const port = Number(process.env.PORT) || 30002;

app.listen(port, server => {
  console.log(`
🚀 服务器启动成功！

📡 服务地址: http://${server.hostname}:${server.port}
📖 API 文档: http://${server.hostname}:${server.port}/doc
🏥 健康检查: http://${server.hostname}:${server.port}/health
  `);
});
