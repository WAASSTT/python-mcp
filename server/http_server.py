"""HTTP server implementation"""
import os
import socket
import time
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from server.types import Config
from server.config.logger import create_logger


logger = create_logger("HttpServer")


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


def create_http_app(config: Config) -> FastAPI:
    """Create FastAPI HTTP application"""
    app = FastAPI(
        title="Voice Backend Server",
        description="语音后台服务器 - Python + FastAPI",
        version="2.0.0"
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static files for OTA firmware downloads
    bin_dir = Path("data/bin")
    if bin_dir.exists():
        app.mount("/download", StaticFiles(directory=str(bin_dir)), name="download")

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "ok",
            "timestamp": datetime.now().isoformat(),
            "uptime": time.process_time()
        }

    # OTA endpoint - GET
    @app.get("/xiaozhi/ota/")
    async def ota_get():
        """OTA firmware information endpoint"""
        local_ip = get_local_ip()
        port = config.server.port
        http_port = config.server.http_port
        websocket_url = f"ws://{local_ip}:{port}"

        return {
            "version": "2.0.0",
            "websocketUrl": websocket_url,
            "httpUrl": f"http://{local_ip}:{http_port}",
            "firmwareUrl": f"http://{local_ip}:{http_port}/download/firmware.bin",
            "description": "Python版本语音后台服务器"
        }

    # OTA endpoint - POST
    @app.post("/xiaozhi/ota/")
    async def ota_post(request: Request):
        """OTA firmware update endpoint"""
        try:
            data = await request.json()
            device_id = data.get("deviceId", "unknown")
            current_version = data.get("version", "unknown")

            logger.info(f"OTA request from device: {device_id}, version: {current_version}")

            local_ip = get_local_ip()
            http_port = config.server.http_port

            # Check if firmware file exists
            firmware_path = Path("data/bin/firmware.bin")
            if not firmware_path.exists():
                return {
                    "update": False,
                    "message": "No firmware available"
                }

            return {
                "update": True,
                "version": "2.0.0",
                "url": f"http://{local_ip}:{http_port}/download/firmware.bin",
                "md5": "",  # TODO: Calculate MD5 hash
                "size": firmware_path.stat().st_size
            }

        except Exception as e:
            logger.error(f"OTA error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Vision upload endpoint
    @app.post("/xiaozhi/vision/")
    async def vision_upload(request: Request):
        """Vision image upload and analysis endpoint"""
        try:
            # TODO: Implement vision analysis with VLLM provider
            return {
                "success": True,
                "message": "Vision analysis not yet implemented"
            }
        except Exception as e:
            logger.error(f"Vision error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    # Get device list
    @app.get("/api/devices")
    async def get_devices():
        """Get all connected devices"""
        from .websocket_server import connection_manager
        devices = connection_manager.get_all_devices()
        return {
            "total": len(devices),
            "devices": [
                {
                    "clientId": d.client_id,
                    "macAddress": d.mac_address,
                    "deviceModel": d.device_model,
                    "connectedAt": d.connected_at.isoformat(),
                    "lastActivity": d.last_activity.isoformat()
                }
                for d in devices
            ]
        }

    # Get configuration
    @app.get("/api/config")
    async def get_config():
        """Get server configuration"""
        return {
            "server": {
                "ip": config.server.ip,
                "port": config.server.port,
                "http_port": config.server.http_port
            },
            "modules": {
                "ASR": config.selected_module.ASR,
                "LLM": config.selected_module.LLM,
                "TTS": config.selected_module.TTS,
                "VAD": config.selected_module.VAD,
                "VLLM": config.selected_module.VLLM
            }
        }

    return app
