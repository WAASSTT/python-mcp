"""Configuration loader module"""
import os
import yaml
from pathlib import Path
from typing import Any, Dict
from server.types import Config, ServerConfig, LogConfig, SelectedModule


def get_project_dir() -> str:
    """Get project root directory"""
    return os.getcwd() + "/"


def read_config(config_path: str) -> Dict[str, Any]:
    """Read YAML configuration file"""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error reading config file {config_path}: {e}")
        raise


def merge_configs(default_config: Dict[str, Any], custom_config: Dict[str, Any]) -> Dict[str, Any]:
    """Merge configuration dictionaries"""
    merged = default_config.copy()

    for key, value in custom_config.items():
        if isinstance(value, dict) and key in merged and isinstance(merged[key], dict):
            merged[key] = merge_configs(merged[key], value)
        else:
            merged[key] = value

    return merged


def ensure_directories(config: Config) -> None:
    """Ensure all necessary directories exist"""
    project_dir = Path(get_project_dir())
    dirs_to_create = set()

    # Log directory
    log_dir = config.log.log_dir or "tmp"
    dirs_to_create.add(project_dir / log_dir)

    # ASR output directories
    if config.ASR:
        for provider in config.ASR.values():
            if isinstance(provider, dict) and provider.get('output_dir'):
                dirs_to_create.add(project_dir / provider['output_dir'])

    # TTS output directories
    if config.TTS:
        for provider in config.TTS.values():
            if isinstance(provider, dict) and provider.get('output_dir'):
                dirs_to_create.add(project_dir / provider['output_dir'])

    # Data directory
    dirs_to_create.add(project_dir / "data")
    dirs_to_create.add(project_dir / "data" / "bin")

    # Create directories
    for dir_path in dirs_to_create:
        dir_path.mkdir(parents=True, exist_ok=True)


def load_config() -> Config:
    """Load configuration from YAML files"""
    project_dir = get_project_dir()

    # Read default configuration
    default_config_path = os.path.join(project_dir, "config.yaml")
    config_data = read_config(default_config_path)

    # Read custom configuration if exists
    custom_config_path = os.path.join(project_dir, "data", ".config.yaml")
    if os.path.exists(custom_config_path):
        custom_config = read_config(custom_config_path)
        config_data = merge_configs(config_data, custom_config)

    # Parse configuration
    server_config = ServerConfig(**config_data.get('server', {}))
    log_config = LogConfig(**config_data.get('log', {}))
    selected_module = SelectedModule(**config_data.get('selected_module', {}))

    config = Config(
        server=server_config,
        log=log_config,
        selected_module=selected_module,
        mcp_endpoint=config_data.get('mcp_endpoint', 'ws://localhost:8000/mcp/'),
        ASR=config_data.get('ASR', {}),
        LLM=config_data.get('LLM', {}),
        VLLM=config_data.get('VLLM', {}),
        TTS=config_data.get('TTS', {}),
        VAD=config_data.get('VAD', {}),
        Intent=config_data.get('Intent', {}),
        Memory=config_data.get('Memory', {})
    )

    # Ensure directories exist
    ensure_directories(config)

    return config
