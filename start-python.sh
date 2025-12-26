#!/bin/bash

# Python Voice Backend Server - Start Script

echo "Starting Python Voice Backend Server..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed"
    echo "Please install uv first: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    uv venv
fi

# Sync dependencies
echo "Syncing dependencies..."
uv sync

# Start the server
echo "Starting server..."
uv run python main.py
