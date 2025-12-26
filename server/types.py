"""Type definitions for the server"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Literal, TYPE_CHECKING
from dataclasses import dataclass, field
from enum import Enum
from collections import deque

if TYPE_CHECKING:
    from fastapi import WebSocket
    from server.providers.vad import VADProvider
    from server.providers.asr import ASRProvider
    from server.providers.llm import LLMProvider
    from server.providers.tts import TTSProvider


@dataclass
class ServerConfig:
    """Server configuration"""
    ip: str = "0.0.0.0"
    port: int = 8000
    http_port: int = 8003
    auth_key: str = "your-auth-key-change-this"
    vision_explain: str = ""


@dataclass
class LogConfig:
    """Logging configuration"""
    level: str = "info"
    log_dir: str = "tmp"


@dataclass
class SelectedModule:
    """Selected AI modules"""
    ASR: str = "xunfei_stream"
    LLM: str = "qwen_flash"
    VLLM: str = "qwen_vl"
    TTS: str = "huoshan_stream"
    VAD: str = "silero"
    Intent: str = "function_call"
    Memory: str = "mem_local_short"


@dataclass
class Config:
    """Main configuration"""
    server: ServerConfig
    log: LogConfig
    selected_module: SelectedModule
    mcp_endpoint: str = "ws://localhost:8000/mcp/"
    ASR: Dict[str, Any] = field(default_factory=dict)
    LLM: Dict[str, Any] = field(default_factory=dict)
    VLLM: Dict[str, Any] = field(default_factory=dict)
    TTS: Dict[str, Any] = field(default_factory=dict)
    VAD: Dict[str, Any] = field(default_factory=dict)
    Intent: Dict[str, Any] = field(default_factory=dict)
    Memory: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DeviceInfo:
    """Device information"""
    client_id: str
    mac_address: Optional[str] = None
    device_model: Optional[str] = None
    connected_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)


@dataclass
class Message:
    """Chat message"""
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class SessionInfo:
    """Session information"""
    session_id: str
    device_id: str
    start_time: datetime = field(default_factory=datetime.now)
    messages: List[Message] = field(default_factory=list)


class MessageType(str, Enum):
    """WebSocket message types"""
    HELLO = "hello"
    TEXT = "text"
    AUDIO = "audio"
    CONFIG = "config"
    CONTROL = "control"
    ERROR = "error"
    STT = "stt"
    LLM = "llm"
    TTS = "tts"


@dataclass
class WSMessage:
    """WebSocket message"""
    type: MessageType
    data: Any
    session_id: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ConnectionState:
    """Connection state for audio processing"""
    client_id: str
    websocket: Optional['WebSocket'] = None
    session_id: Optional[str] = None

    # VAD state
    audio_buffer: bytearray = field(default_factory=bytearray)
    have_voice: bool = False
    voice_stop: bool = False
    voice_window: deque = field(default_factory=lambda: deque(maxlen=5))
    last_is_voice: bool = False
    last_activity_time: float = 0

    # ASR state
    asr_audio: List[bytes] = field(default_factory=list)

    # TTS state
    is_speaking: bool = False

    # Configuration
    listen_mode: Literal["auto", "manual"] = "auto"
    audio_format: str = "opus"

    # Providers
    vad: Optional['VADProvider'] = None
    asr: Optional['ASRProvider'] = None
    llm: Optional['LLMProvider'] = None
    tts: Optional['TTSProvider'] = None

    # Chat history
    chat_history: List[Dict[str, str]] = field(default_factory=list)

    def reset_vad_states(self) -> None:
        """Reset VAD states"""
        self.have_voice = False
        self.voice_stop = False
        self.last_is_voice = False
        self.voice_window.clear()

    def add_message(self, role: str, content: str) -> None:
        """Add message to chat history"""
        self.chat_history.append({"role": role, "content": content})
        # Keep last 10 messages
        if len(self.chat_history) > 20:
            self.chat_history = self.chat_history[-20:]

