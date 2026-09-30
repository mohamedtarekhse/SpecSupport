#!/usr/bin/env bash
echo "========================================================================="
echo "   LOCASPEC(TM) ENTERPRISE RIG AI SERVER"
echo "   Zero-Connectivity Offline Rig Intelligence (Ollama / LocalAI)"
echo "========================================================================="

if ! command -v ollama &> /dev/null; then
    echo "[ERROR] Ollama is not installed."
    echo "Install via: curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi

export OLLAMA_ORIGINS="*"
export OLLAMA_HOST="0.0.0.0:11434"

echo "[1/2] Launching Ollama server with CORS enabled..."
ollama serve &
SERVER_PID=$!
sleep 3

echo "[2/2] Pulling engineering model: qwen2.5:3b..."
ollama pull qwen2.5:3b

echo ""
echo "========================================================================="
echo " LocaSpec Rig AI Server is RUNNING on http://0.0.0.0:11434/v1"
echo " Active Model: qwen2.5:3b"
echo "========================================================================="
wait $SERVER_PID
