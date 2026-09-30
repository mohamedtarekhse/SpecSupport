@echo off
TITLE LocaSpec Rig AI Server (Offline Rig Engine)
COLOR 0B
echo =========================================================================
echo    LOCASPEC(TM) ENTERPRISE RIG AI SERVER
echo    Zero-Connectivity Offline Rig Intelligence (Ollama / LocalAI)
echo =========================================================================
echo.

where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Ollama is not installed on this PC.
    echo 1. Download Ollama from: https://ollama.com/download
    echo 2. Or install via Windows Terminal: winget install Ollama.Ollama
    echo.
    pause
    exit /b 1
)

echo [1/3] Enabling Cross-Origin Resource Sharing (CORS) for SpecSupport...
set OLLAMA_ORIGINS=*
set OLLAMA_HOST=0.0.0.0:11434

echo [2/3] Checking / Downloading local engineering model (qwen2.5:3b)...
echo (This model excels at both Arabic and English technical standards reasoning)
start /B ollama serve >nul 2>nul
timeout /t 3 >nul

ollama pull qwen2.5:3b

echo.
echo =========================================================================
echo [3/3] LocaSpec Rig AI Server is RUNNING and LISTENING!
echo.
echo  Local Endpoint:  http://localhost:11434/v1
echo  Rig LAN Address: http://0.0.0.0:11434/v1
echo  Active Model:    qwen2.5:3b
echo.
echo  In SpecSupport LocaSpec Panel:
echo  1. Enter: http://localhost:11434/v1
echo  2. Click "Test Connection"
echo  3. Enjoy 100% offline fluent LLM reasoning in the doghouse or pipe deck!
echo =========================================================================
echo.
echo Press Ctrl+C to stop the server when rig operations conclude.
ollama run qwen2.5:3b
