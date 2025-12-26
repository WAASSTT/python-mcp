"""Main entry point for the voice backend server"""
import asyncio
import socket
from server.config.loader import load_config
from server.config.logger import create_logger
from server.http_server import create_http_app
from server.websocket_server import websocket_endpoint
import uvicorn
from fastapi import FastAPI, WebSocket


logger = create_logger("Main")


def get_local_ip() -> str:
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


async def main():
    """Main entry point - start all services"""
    try:
        logger.info("正在启动语音后台服务器...")

        # Load configuration
        config = load_config()

        # Display configuration
        local_ip = get_local_ip()
        logger.info("=" * 80)
        logger.info("服务器配置:")
        logger.info(f"  本地IP: {local_ip}")
        logger.info(f"  WebSocket端口: {config.server.port}")
        logger.info(f"  HTTP端口: {config.server.http_port}")
        logger.info(f"  日志级别: {config.log.level}")
        logger.info("")
        logger.info("AI模块配置:")
        logger.info(f"  ASR: {config.selected_module.ASR}")
        logger.info(f"  LLM: {config.selected_module.LLM}")
        logger.info(f"  TTS: {config.selected_module.TTS}")
        logger.info(f"  VAD: {config.selected_module.VAD}")
        logger.info(f"  VLLM: {config.selected_module.VLLM}")
        logger.info("=" * 80)

        # Create HTTP app
        app = create_http_app(config)

        # Add WebSocket endpoint
        @app.websocket("/")
        async def ws_endpoint(websocket: WebSocket):
            # 检查是否有 device-id header
            device_id = websocket.headers.get("device-id") or websocket.query_params.get("device-id")
            if not device_id:
                # 缺少 device-id,拒绝连接
                try:
                    await websocket.accept()
                    await websocket.send_json({
                        'type': 'error',
                        'data': {'error': '缺少 device-id 参数'}
                    })
                    await websocket.close(code=1008, reason="Missing device-id")
                except Exception as e:
                    logger.error(f"Error closing connection: {e}")
                return
            await websocket_endpoint(websocket, config)

        # Display access information
        logger.info("")
        logger.info("服务器已启动:")
        logger.info(f"  WebSocket: ws://{local_ip}:{config.server.port}/")
        logger.info(f"  HTTP API: http://{local_ip}:{config.server.http_port}/")
        logger.info(f"  健康检查: http://{local_ip}:{config.server.http_port}/health")
        logger.info(f"  API文档: http://{local_ip}:{config.server.http_port}/docs")
        logger.info("")

        # Run server
        server_config = uvicorn.Config(
            app,
            host=config.server.ip,
            port=config.server.port,
            log_level=config.log.level.lower(),
            access_log=True
        )
        server = uvicorn.Server(server_config)
        await server.serve()

    except Exception as e:
        logger.error(f"启动服务器失败: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
