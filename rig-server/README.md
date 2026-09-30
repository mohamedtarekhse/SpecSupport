# 🛰️ LocaSpec™ Enterprise Rig AI Server Setup

This directory contains one-click launchers to host a **100% Offline Local AI Server** directly on an oilfield drilling rig, doghouse workstation, or inspector laptop.

### 🌟 Why Run a Local Rig AI Server?
- **Zero Internet Required**: Works in deep desert, offshore jackets, or remote pipeline spreads.
- **Fluent Conversational AI**: Synthesizes verified standard clauses into clear, executive answers instead of raw data dumps.
- **Arabic & English Support**: High accuracy using the high-efficiency `qwen2.5:3b` or `qwen2.5:7b` weights.
- **LAN Shared Access**: One doghouse laptop can serve ALL rugged tablets and phones on the rig Wi-Fi simultaneously!

### 🚀 1-Click Launch:
- **Windows**: Double-click `run-locaspec-server.bat`
- **Linux/Mac**: Run `bash run-locaspec-server.sh`
- **Docker**: Run `docker compose up -d`

### 🔗 SpecSupport Integration:
1. Open SpecSupport (even offline).
2. Click **LocaSpec™** in the header.
3. Under **Local Rig AI Server**, ensure URL is `http://localhost:11434/v1` (or LAN IP) and model is `qwen2.5:3b`.
4. Click **Test Connection**.
5. All offline queries will now be synthesized in real-time by your local rig AI!
