"""Logger module using loguru"""
import sys
from loguru import logger
from pathlib import Path


def create_logger(name: str, log_level: str = "INFO", log_dir: str = "tmp"):
    """Create a logger instance

    Args:
        name: Logger name/tag
        log_level: Log level (DEBUG, INFO, WARNING, ERROR)
        log_dir: Directory for log files
    """
    # Remove default handler
    logger.remove()

    # Add console handler with format
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{extra[tag]}</cyan> | <level>{message}</level>",
        level=log_level.upper(),
        colorize=True
    )

    # Add file handler
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    logger.add(
        log_path / f"{name}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {extra[tag]} | {message}",
        level=log_level.upper(),
        rotation="10 MB",
        retention="7 days",
        compression="zip"
    )

    # Bind the tag
    return logger.bind(tag=name)


# Default logger
default_logger = create_logger("Server")
