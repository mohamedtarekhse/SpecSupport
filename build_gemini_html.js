const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Inspecta | AI Engineering Standards & Inspection Assistant</title>
    <!-- Marked Markdown Parser -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- PDF.js for Client-Side Parsing -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <!-- Google Fonts: Inter Sans-Serif & Tajawal (Arabic) -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            /* True Google Gemini Obsidian Dark Palette (Default) */
            --gemini-bg: #131314;
            --gemini-surface: #1E1F20;
            --gemini-surface-hover: #282A2C;
            --gemini-border: #303134;
            --gemini-text-main: #E3E3E3;
            --gemini-text-muted: #C4C7C5;
            --gemini-blue: #1A73E8;
            --gemini-blue-hover: #1765CC;
            --gemini-blue-light: #8AB4F8;
            --gemini-pill-bg: #282A2C;
            --gemini-card-bg: #1E1F20;
            --gemini-card-border: #303134;
            --gemini-gradient: linear-gradient(74deg, #4285F4 0%, #9B72CB 25%, #D96570 50%, #9B72CB 75%, #4285F4 100%);
            --max-width: 860px;
        }

        :root.light-mode {
            /* Google Gemini Soft Ice Light Palette */
            --gemini-bg: #FFFFFF;
            --gemini-surface: #F0F4F9;
            --gemini-surface-hover: #E1E8F0;
            --gemini-border: #E1E3E1;
            --gemini-text-main: #1F1F1F;
            --gemini-text-muted: #444746;
            --gemini-blue: #0B57D0;
            --gemini-blue-hover: #0842A0;
            --gemini-blue-light: #1A73E8;
            --gemini-pill-bg: #E1E8F0;
            --gemini-card-bg: #F0F4F9;
            --gemini-card-border: #E1E3E1;
        }

        /* Base Reset */
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--gemini-border); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--gemini-text-muted); }

        body {
            margin: 0; padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--gemini-bg);
            color: var(--gemini-text-main);
            display: flex; flex-direction: column;
            height: 100vh; height: 100dvh;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }

        body.rtl {
            font-family: 'Tajawal', sans-serif;
            direction: rtl;
        }

        /* Header */
        header {
            padding: 12px 20px;
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--gemini-border);
            z-index: 100;
            background-color: var(--gemini-bg);
        }

        .header-left {
            display: flex; align-items: center; gap: 10px;
        }

        .logo-title {
            display: flex; align-items: center; gap: 8px;
            font-size: 1.15rem; font-weight: 600;
            color: var(--gemini-text-main);
            text-decoration: none;
            letter-spacing: -0.3px;
        }

        .sparkle-icon {
            background: var(--gemini-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 1.3rem;
            animation: pulse-sparkle 3s infinite ease-in-out;
        }

        @keyframes pulse-sparkle {
            0%, 100% { opacity: 0.85; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.15); }
        }

        /* 3-Mode Segmented Pill Switcher */
        .gemini-mode-switch {
            display: flex;
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            border-radius: 24px;
            padding: 3px;
            gap: 2px;
        }

        .mode-pill {
            background: transparent;
            border: none;
            color: var(--gemini-text-muted);
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.82rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; align-items: center; gap: 6px;
        }

        .mode-pill:hover {
            color: var(--gemini-text-main);
        }

        .mode-pill.active {
            background: var(--gemini-pill-bg);
            color: var(--gemini-text-main);
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            font-weight: 600;
        }

        .header-actions {
            display: flex; align-items: center; gap: 8px;
        }

        .icon-btn {
            background: transparent;
            border: 1px solid transparent;
            color: var(--gemini-text-muted);
            width: 38px; height: 38px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 1rem;
        }

        .icon-btn:hover {
            background: var(--gemini-surface);
            color: var(--gemini-text-main);
            border-color: var(--gemini-border);
        }

        /* Main View Container */
        #app-container {
            flex: 1; display: flex; flex-direction: column; align-items: center;
            position: relative; width: 100%; overflow: hidden;
        }

        /* Hero Greeting Area */
        #greeting-area {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            width: 100%; max-width: var(--max-width);
            padding: 20px 20px 80px 20px;
            box-sizing: border-box;
            text-align: center;
            transition: opacity 0.3s ease;
        }

        .gemini-hero-headline {
            font-size: 2.8rem;
            font-weight: 600;
            margin: 0 0 12px 0;
            letter-spacing: -0.8px;
            background: var(--gemini-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% auto;
            animation: gradient-flow 6s infinite alternate;
        }

        @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }

        .gemini-hero-sub {
            font-size: 1.1rem;
            color: var(--gemini-text-muted);
            margin: 0 0 35px 0;
            font-weight: 400;
        }

        /* 4 Gemini-Style Prompt Cards */
        .prompt-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            width: 100%;
            max-width: var(--max-width);
            margin-bottom: 25px;
        }

        .prompt-card {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-card-border);
            border-radius: 16px;
            padding: 16px;
            text-align: left;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; justify-content: space-between;
            min-height: 110px;
            position: relative;
        }
        body.rtl .prompt-card { text-align: right; }

        .prompt-card:hover {
            background: var(--gemini-surface-hover);
            transform: translateY(-2px);
            border-color: var(--gemini-blue-light);
            box-shadow: 0 6px 16px rgba(0,0,0,0.25);
        }

        .prompt-card-icon {
            font-size: 1.3rem; margin-bottom: 8px;
        }

        .prompt-card-text {
            font-size: 0.85rem;
            color: var(--gemini-text-main);
            line-height: 1.4;
            font-weight: 500;
        }

        /* Chat Window */
        #chat-window {
            display: none;
            flex: 1; width: 100%; max-width: var(--max-width);
            overflow-y: auto;
            padding: 24px 20px 140px 20px;
            box-sizing: border-box;
            scroll-behavior: smooth;
        }

        .message-row {
            display: flex; gap: 16px; margin-bottom: 28px;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        .avatar-box {
            width: 32px; height: 32px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.95rem; flex-shrink: 0; margin-top: 2px;
        }
        .user-avatar { background: var(--gemini-surface); border: 1px solid var(--gemini-border); }
        .ai-avatar { background: var(--gemini-surface); border: 1px solid var(--gemini-border); }

        .message-body {
            flex: 1; font-size: 0.98rem; line-height: 1.65;
            color: var(--gemini-text-main);
        }

        .message-body h1, .message-body h2, .message-body h3 {
            font-weight: 600; margin: 16px 0 8px 0;
            color: var(--gemini-text-main);
        }
        .message-body p { margin: 0 0 12px 0; }
        .message-body strong { color: #FFF; font-weight: 600; }
        :root.light-mode .message-body strong { color: #000; }
        .message-body ul, .message-body ol { margin: 8px 0 12px 0; padding-left: 22px; }
        body.rtl .message-body ul, body.rtl .message-body ol { padding-left: 0; padding-right: 22px; }

        /* Markdown Table Styling */
        .message-body table {
            width: 100%; border-collapse: collapse; margin: 16px 0;
            background: var(--gemini-surface); border-radius: 8px; overflow: hidden;
            font-size: 0.9rem;
        }
        .message-body th, .message-body td {
            padding: 10px 14px; text-align: left;
            border-bottom: 1px solid var(--gemini-border);
        }
        body.rtl .message-body th, body.rtl .message-body td { text-align: right; }
        .message-body th { background: var(--gemini-surface-hover); font-weight: 600; }

        /* Response Action Toolbar */
        .response-toolbar {
            display: flex; align-items: center; gap: 8px;
            margin-top: 14px; padding-top: 8px;
        }
        .tool-btn {
            background: transparent; border: 1px solid transparent;
            color: var(--gemini-text-muted); padding: 5px 10px; border-radius: 8px;
            cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;
            transition: all 0.2s;
        }
        .tool-btn:hover {
            background: var(--gemini-surface); color: var(--gemini-text-main);
            border-color: var(--gemini-border);
        }

        /* Continue Generating Pill */
        .continue-btn {
            margin: 12px 0;
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            color: var(--gemini-blue-light);
            padding: 7px 16px; border-radius: 20px;
            cursor: pointer; font-size: 0.82rem; font-weight: 500;
            display: inline-flex; align-items: center; gap: 6px;
            transition: all 0.2s;
        }
        .continue-btn:hover {
            background: var(--gemini-surface-hover);
            border-color: var(--gemini-blue-light);
        }

        /* Suggested Follow-up Question Chips */
        .followups-container {
            display: flex; flex-wrap: wrap; gap: 8px;
            margin: 16px 0 8px 0;
        }
        .followup-chip {
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            color: var(--gemini-text-main);
            padding: 7px 14px; border-radius: 20px;
            font-size: 0.82rem; cursor: pointer;
            transition: all 0.2s; display: inline-flex; align-items: center; gap: 6px;
        }
        .followup-chip:hover {
            background: var(--gemini-surface-hover);
            border-color: var(--gemini-blue-light);
            color: var(--gemini-blue-light);
        }

        /* Sources Accordion */
        .sources-accordion {
            margin-top: 12px; font-size: 0.82rem;
            color: var(--gemini-text-muted);
            border: 1px solid var(--gemini-border);
            border-radius: 8px; padding: 8px 12px;
            background: var(--gemini-surface);
        }
        .sources-accordion summary { cursor: pointer; font-weight: 500; outline: none; }
        .sources-accordion ul { margin: 8px 0 0 0; padding-left: 18px; }

        /* Monochrome 3-Dot Morphing Loading Status */
        #gemini-status-container {
            display: none;
            align-items: center; gap: 10px;
            padding: 10px 0; color: var(--gemini-text-muted);
            font-size: 0.9rem;
            margin-bottom: 20px;
        }
        .status-dots {
            display: flex; gap: 5px; align-items: center;
        }
        .status-dot {
            width: 6px; height: 6px; background-color: var(--gemini-text-muted);
            border-radius: 50%; opacity: 0.4;
            animation: pulse-dot 1.4s infinite ease-in-out;
        }
        .status-dot:nth-child(2) { animation-delay: 0.2s; }
        .status-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse-dot {
            0%, 100% { opacity: 0.3; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.15); }
        }
        .status-phrase {
            transition: opacity 0.3s ease;
            font-size: 0.88rem;
        }

        /* Floating 32px Gemini Input Pill */
        #input-container {
            width: 100%; max-width: var(--max-width);
            padding: 0 20px 24px 20px;
            box-sizing: border-box;
            position: absolute; bottom: 0;
            transition: all 0.3s ease;
            z-index: 50;
        }

        .state-greeting #input-container {
            position: relative; bottom: auto; padding: 0;
        }

        .gemini-pill-box {
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            border-radius: 32px;
            display: flex; align-items: flex-end;
            padding: 10px 14px 10px 16px;
            transition: border-color 0.2s, background 0.2s;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .gemini-pill-box:focus-within {
            border-color: #5A5C60;
            background: var(--gemini-surface-hover);
        }

        .pill-attach-btn {
            background: transparent; border: none;
            color: var(--gemini-text-muted);
            width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.2rem;
            margin-bottom: 2px; flex-shrink: 0;
            transition: all 0.2s;
        }
        .pill-attach-btn:hover { background: rgba(255,255,255,0.08); color: var(--gemini-text-main); }

        .gemini-pill-box textarea {
            flex: 1; background: transparent; border: none;
            color: var(--gemini-text-main); font-size: 0.98rem;
            font-family: inherit; resize: none;
            padding: 8px 10px; min-height: 24px; max-height: 160px;
            outline: none; line-height: 1.5;
        }
        .gemini-pill-box textarea::placeholder { color: var(--gemini-text-muted); }

        .pill-mic-btn {
            background: transparent; border: none;
            color: var(--gemini-text-muted);
            width: 36px; height: 36px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.1rem;
            margin-bottom: 2px; flex-shrink: 0;
            transition: all 0.2s;
        }
        .pill-mic-btn:hover { color: var(--gemini-text-main); }
        .pill-mic-btn.recording {
            color: #EA4335; animation: mic-pulse 1.2s infinite ease-in-out;
        }
        @keyframes mic-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }

        .pill-send-btn {
            background: var(--gemini-blue);
            color: #FFF; border: none;
            width: 38px; height: 38px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; margin-bottom: 1px; margin-left: 6px; flex-shrink: 0;
            transition: background 0.2s, transform 0.1s;
        }
        body.rtl .pill-send-btn { margin-left: 0; margin-right: 6px; }
        .pill-send-btn:hover { background: var(--gemini-blue-hover); transform: scale(1.04); }
        .pill-send-btn.stop-mode {
            background: var(--gemini-surface-hover); border: 1px solid var(--gemini-border);
            color: var(--gemini-text-main);
        }

        .gemini-disclaimer {
            text-align: center; font-size: 0.73rem;
            color: var(--gemini-text-muted); margin-top: 8px;
        }

        /* Modals: Defect Vision & Standards Hub */
        .gemini-modal {
            display: none; position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
            z-index: 1000; align-items: center; justify-content: center;
            padding: 20px; box-sizing: border-box;
        }
        .gemini-modal-content {
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            border-radius: 20px; max-width: 680px; width: 100%;
            padding: 24px; box-sizing: border-box;
            box-shadow: 0 16px 40px rgba(0,0,0,0.5);
            max-height: 90vh; overflow-y: auto;
            position: relative;
        }
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 18px; border-bottom: 1px solid var(--gemini-border);
            padding-bottom: 12px;
        }
        .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 600; }
        .close-modal-btn {
            background: transparent; border: none; color: var(--gemini-text-muted);
            font-size: 1.3rem; cursor: pointer; padding: 4px;
        }

        /* Canvas & Defect Vision */
        #vision-canvas-container {
            position: relative; width: 100%; border: 1px dashed var(--gemini-border);
            border-radius: 12px; min-height: 240px; display: flex;
            align-items: center; justify-content: center; overflow: hidden;
            background: #000; margin-bottom: 15px;
        }
        #defect-canvas { max-width: 100%; max-height: 380px; object-fit: contain; }

        .vision-metrics-card {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-border);
            border-radius: 12px; padding: 14px; margin-bottom: 15px;
            font-size: 0.88rem; line-height: 1.5;
        }
        .metric-badge {
            display: inline-block; padding: 3px 8px; border-radius: 6px;
            font-weight: 600; font-size: 0.8rem; margin-right: 6px;
        }
        .badge-reject { background: #EA4335; color: #FFF; }
        .badge-accept { background: #34A853; color: #FFF; }

        /* Admin Slide-Over Panel */
        #admin-panel {
            display: none; position: absolute;
            top: 60px; right: 20px;
            background: var(--gemini-surface);
            border: 1px solid var(--gemini-border);
            border-radius: 16px; width: 340px;
            padding: 20px; z-index: 200;
            box-shadow: 0 12px 30px rgba(0,0,0,0.5);
            max-height: 80vh; overflow-y: auto;
        }
        body.rtl #admin-panel { right: auto; left: 20px; }
        .admin-input {
            width: 100%; margin-bottom: 12px; padding: 8px 12px;
            background: var(--gemini-bg); color: var(--gemini-text-main);
            border: 1px solid var(--gemini-border); border-radius: 8px;
            box-sizing: border-box; font-family: inherit; font-size: 0.88rem;
        }

        /* Mobile Ergonomics */
        @media (max-width: 768px) {
            .prompt-cards-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            .gemini-hero-headline { font-size: 2.1rem; }
            .gemini-mode-switch .mode-pill { padding: 5px 9px; font-size: 0.75rem; }
            .header-actions { gap: 4px; }
            .icon-btn { width: 34px; height: 34px; }
            #chat-window { padding: 16px 14px 130px 14px; }
            #input-container { padding: 0 12px 14px 12px; }
        }
        @media (max-width: 480px) {
            .prompt-cards-grid {
                display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
                padding-bottom: 10px;
            }
            .prompt-card { min-width: 220px; scroll-snap-align: start; }
        }
    </style>
</head>
<body>

    <!-- Header Navigation Bar -->
    <header>
        <div class="header-left">
            <a href="#" class="logo-title" onclick="resetChat(); return false;">
                <span class="sparkle-icon">✦</span>
                <span>Inspecta</span>
            </a>
        </div>

        <!-- Centered 3-Mode Segmented Pill Switcher (Web Mode Default) -->
        <div class="gemini-mode-switch">
            <button id="mode-web-btn" class="mode-pill active" onclick="setMode('web')">🌐 Web Mode</button>
            <button id="mode-standards-btn" class="mode-pill" onclick="setMode('standards')">📚 Standards</button>
            <button id="mode-expert-btn" class="mode-pill" onclick="setMode('expert')">💡 Ask Expert</button>
        </div>

        <div class="header-actions">
            <button class="icon-btn" title="On-Device Defect Vision" onclick="openVisionModal()">📷</button>
            <button class="icon-btn" title="Standards & Specs Hub" onclick="openStandardsModal()">📁</button>
            <button class="icon-btn" title="Purge Cache & Refresh" onclick="forceCachePurge()">♻️</button>
            <button class="icon-btn" title="Toggle Dark/Light Mode" onclick="toggleTheme()">🌗</button>
            <button class="icon-btn" title="Admin Settings" onclick="toggleAdminPanel()">⚙️</button>
        </div>
    </header>

    <!-- Main Workspace Area -->
    <div id="app-container" class="state-greeting">

        <!-- Initial Hero Greeting -->
        <div id="greeting-area">
            <h1 class="gemini-hero-headline" id="hero-headline">Hello, Inspector</h1>
            <p class="gemini-hero-sub" id="hero-subtitle">What engineering code, procedure, or defect can I assist you with today?</p>

            <!-- 4 Interactive Gemini Prompt Cards -->
            <div class="prompt-cards-grid">
                <div class="prompt-card" onclick="sendQuickPrompt('What is the maximum allowable hardness for casing in sour service per API 5CT and NACE MR0175?')">
                    <div class="prompt-card-icon">🛢️</div>
                    <div class="prompt-card-text">Sour Service Hardness (API 5CT / NACE)</div>
                </div>
                <div class="prompt-card" onclick="sendQuickPrompt('What is the maximum allowable undercut depth for Normal Fluid Service piping per ASME B31.3?')">
                    <div class="prompt-card-icon">🔍</div>
                    <div class="prompt-card-text">Piping Weld Undercut (ASME B31.3)</div>
                </div>
                <div class="prompt-card" onclick="sendQuickPrompt('What are the minimum and maximum acceptable optical density limits for X-ray and Gamma-ray film per ASME Section V Article 2?')">
                    <div class="prompt-card-icon">☢️</div>
                    <div class="prompt-card-text">RT Optical Density Limits (ASME V)</div>
                </div>
                <div class="prompt-card" onclick="sendQuickPrompt('How do you calculate minimum hydrostatic test pressure and hold time for piping per ASME B31.3?')">
                    <div class="prompt-card-icon">🧪</div>
                    <div class="prompt-card-text">Hydrostatic Pressure Formula & Hold</div>
                </div>
            </div>
        </div>

        <!-- Chat Conversation Area -->
        <div id="chat-window">
            <div id="messages-list"></div>

            <!-- Monochrome 3-Dot Morphing Loading Indicator -->
            <div id="gemini-status-container">
                <div class="status-dots">
                    <div class="status-dot"></div>
                    <div class="status-dot"></div>
                    <div class="status-dot"></div>
                </div>
                <span class="status-phrase" id="status-phrase-text">Analyzing query...</span>
            </div>
        </div>

        <!-- Floating 32px Gemini Input Pill -->
        <div id="input-container">
            <div class="gemini-pill-box">
                <button class="pill-attach-btn" title="Add File or Defect Photo" onclick="toggleAttachmentMenu()">+</button>
                <textarea id="user-input" rows="1" placeholder="Ask Inspecta about engineering standards, welding, or defects..." onkeydown="handleInputKey(event)" oninput="autoGrow(this)"></textarea>
                <button id="mic-btn" class="pill-mic-btn" title="Voice Input" onclick="toggleVoiceInput()">🎙️</button>
                <button id="send-btn" class="pill-send-btn" title="Send" onclick="sendMessage()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                </button>
            </div>
            <div class="gemini-disclaimer">
                Inspecta can make mistakes. Always verify critical acceptance criteria with your project quality plan.
            </div>
        </div>

    </div>

    <!-- Attachment Popup Menu -->
    <div id="attach-popup" style="display:none; position:fixed; bottom:80px; left:25%; background:var(--gemini-surface); border:1px solid var(--gemini-border); border-radius:12px; padding:8px; box-shadow:0 8px 24px rgba(0,0,0,0.4); z-index:200;">
        <button class="tool-btn" style="width:100%; text-align:left; margin-bottom:4px;" onclick="openVisionModal(); hideAttachmentMenu();">📷 Analyze Defect Image (On-Device)</button>
        <button class="tool-btn" style="width:100%; text-align:left;" onclick="openStandardsModal(); hideAttachmentMenu();">📄 Ingest Company Procedure / PDF</button>
    </div>

    <!-- On-Device Defect Computer Vision Modal -->
    <div id="vision-modal" class="gemini-modal">
        <div class="gemini-modal-content">
            <div class="modal-header">
                <h3>📷 On-Device Defect Analyzer (Cracks & Pitting)</h3>
                <button class="close-modal-btn" onclick="closeVisionModal()">&times;</button>
            </div>
            <div style="font-size:0.8rem; color:#10B981; margin-bottom:12px;">
                🔒 100% On-Device Processing. No image bytes leave this device.
            </div>

            <div id="vision-canvas-container">
                <canvas id="defect-canvas"></canvas>
                <div id="canvas-placeholder" style="color:var(--gemini-text-muted); font-size:0.9rem;">
                    Drag & Drop Defect Photo or <label style="color:var(--gemini-blue-light); cursor:pointer; text-decoration:underline;"><input type="file" id="vision-file-input" accept="image/*" style="display:none;" onchange="loadVisionImage(this.files[0])">Browse Photo</label>
                </div>
            </div>

            <!-- Calibration & Analysis Controls -->
            <div style="display:flex; gap:12px; margin-bottom:14px; align-items:center;">
                <label style="font-size:0.82rem; color:var(--gemini-text-muted);">Scale Calibration (px/mm):</label>
                <input type="number" id="calib-scale" value="15" style="width:70px; padding:5px; background:var(--gemini-bg); color:#fff; border:1px solid var(--gemini-border); border-radius:6px;" onchange="recalculateVision()">
                <button class="mode-pill active" onclick="runDefectMeasurement()">🔍 Measure Defect</button>
            </div>

            <!-- Measurement Output Card -->
            <div id="vision-metrics-card" class="vision-metrics-card" style="display:none;">
                <div id="vision-result-summary"></div>
                <div style="margin-top:10px;">
                    <button class="continue-btn" onclick="injectVisionToChat()">Transfer Measurements to Chat for Code Verification ↗</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Standards & Specifications Hub Modal -->
    <div id="standards-modal" class="gemini-modal">
        <div class="gemini-modal-content">
            <div class="modal-header">
                <h3>📁 Standards & Procedures Hub</h3>
                <button class="close-modal-btn" onclick="closeStandardsModal()">&times;</button>
            </div>
            <p style="font-size:0.85rem; color:var(--gemini-text-muted); margin-top:0;">
                Ingest company procedures or international standards with automatic SHA-256 deduplication.
            </p>

            <div style="border:1px dashed var(--gemini-border); border-radius:12px; padding:20px; text-align:center; background:var(--gemini-bg); margin-bottom:15px;">
                <div style="font-size:1.8rem; margin-bottom:6px;">📄</div>
                <div style="font-size:0.9rem; font-weight:500; margin-bottom:4px;">Drag & Drop PDF Standard Here</div>
                <div style="font-size:0.75rem; color:var(--gemini-text-muted); margin-bottom:10px;">Auto-SHA256 Fingerprint Check Enabled</div>
                <input type="file" id="hub-pdf-input" accept="application/pdf" style="display:none;" onchange="handleSmartPDFUpload(this.files[0])">
                <button class="mode-pill active" onclick="document.getElementById('hub-pdf-input').click()">Select PDF File</button>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
                <div>
                    <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Standard Code (e.g. SAES-W-011):</label>
                    <input type="text" id="hub-std-code" class="admin-input" placeholder="Code">
                </div>
                <div>
                    <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Standard Title:</label>
                    <input type="text" id="hub-std-name" class="admin-input" placeholder="Welding Specification">
                </div>
            </div>

            <div style="margin-bottom:15px;">
                <label style="font-size:0.75rem; color:var(--gemini-text-muted); display:block; margin-bottom:5px;">Scope & Privacy:</label>
                <label style="font-size:0.82rem; margin-right:15px; cursor:pointer;"><input type="radio" name="hub-scope" value="global" checked> Global / Shared Library</label>
                <label style="font-size:0.82rem; cursor:pointer;"><input type="radio" name="hub-scope" value="private_temp"> Private Session Sandbox (Auto-Erased in 24h)</label>
            </div>

            <div id="hub-log" style="background:#000; color:#10B981; font-family:monospace; font-size:0.75rem; padding:10px; border-radius:8px; max-height:120px; overflow-y:auto; display:none;"></div>
        </div>
    </div>

    <!-- Admin Panel Slider -->
    <div id="admin-panel">
        <h3 style="margin-top:0; font-size:1.05rem; display:flex; justify-content:space-between; align-items:center;">
            <span>Admin Settings</span>
            <button style="background:none; border:none; color:var(--gemini-text-muted); cursor:pointer;" onclick="toggleAdminPanel()">&times;</button>
        </h3>
        <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Admin Secret Token:</label>
        <input type="password" id="admin-token" class="admin-input" placeholder="Secret Token">

        <label style="font-size:0.75rem; color:var(--gemini-text-muted); margin-top:5px; display:block;">Active AI Provider:</label>
        <select id="active-provider" class="admin-input" onchange="toggleProviderSettings()">
            <option value="cloudflare" selected>Cloudflare Workers AI (GLM-5.3 & Llama)</option>
            <option value="groq">Groq (Ultra-Fast Llama 3)</option>
            <option value="openrouter">OpenRouter (NVIDIA & Large Models)</option>
        </select>

        <div id="cf-settings">
            <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Cloudflare Model:</label>
            <select id="model-cloudflare" class="admin-input">
                <option value="@cf/zai-org/glm-5.3-flash" selected>GLM-5.3 Flash (320B MoE)</option>
                <option value="@cf/meta/llama-3.1-8b-instruct">Meta Llama 3.1 8B (100% Free)</option>
                <option value="@cf/meta/llama-3.3-70b-instruct-fp8-fast">Meta Llama 3.3 70B Fast</option>
            </select>
        </div>

        <div id="groq-settings" style="display:none;">
            <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Groq API Key:</label>
            <input type="password" id="key-groq" class="admin-input" placeholder="gsk_...">
        </div>

        <div id="or-settings" style="display:none;">
            <label style="font-size:0.75rem; color:var(--gemini-text-muted);">OpenRouter API Key:</label>
            <input type="password" id="key-openrouter" class="admin-input" placeholder="sk-or-v1-...">
            <label style="font-size:0.75rem; color:var(--gemini-text-muted);">Model:</label>
            <select id="model-openrouter" class="admin-input">
                <option value="nvidia/llama-3.1-nemotron-70b-instruct:free">NVIDIA Nemotron 70B (Free)</option>
                <option value="meta-llama/llama-3.1-70b-instruct:free">Meta Llama 3.1 70B (Free)</option>
            </select>
        </div>

        <button class="mode-pill active" style="width:100%; justify-content:center; margin-top:5px;" onclick="saveAdminConfig()">Save Settings</button>
    </div>

    <!-- Core Application Logic -->
    <script>
        const API_BASE = "https://inspection-api.mohamedtarekhse.workers.dev";
        let currentMode = localStorage.getItem('inspecta_mode') || 'web';
        let currentTheme = localStorage.getItem('inspecta_theme') || 'dark';
        let chatHistory = [];
        let sessionId = localStorage.getItem('inspecta_session') || ('sess_' + Math.random().toString(36).substring(2, 12));
        localStorage.setItem('inspecta_session', sessionId);
        let isGenerating = false;
        let speechRecognition = null;
        let lastVisionMetrics = null;

        // Initialize Theme & Mode on Load
        window.addEventListener('DOMContentLoaded', () => {
            if (currentTheme === 'light') document.documentElement.classList.add('light-mode');
            setMode(currentMode, false);
            setupSpeech();
        });

        function toggleTheme() {
            document.documentElement.classList.toggle('light-mode');
            currentTheme = document.documentElement.classList.contains('light-mode') ? 'light' : 'dark';
            localStorage.setItem('inspecta_theme', currentTheme);
        }

        function setMode(mode, save = true) {
            currentMode = mode;
            if (save) localStorage.setItem('inspecta_mode', mode);
            
            document.getElementById('mode-web-btn').classList.toggle('active', mode === 'web');
            document.getElementById('mode-standards-btn').classList.toggle('active', mode === 'standards');
            document.getElementById('mode-expert-btn').classList.toggle('active', mode === 'expert');

            const headline = document.getElementById('hero-headline');
            const sub = document.getElementById('hero-subtitle');
            
            if (mode === 'web') {
                headline.textContent = "Hello, Inspector";
                sub.textContent = "Operating in Web Intelligence Mode. Ask any engineering, welding, or defect question.";
            } else if (mode === 'standards') {
                headline.textContent = "Standards Search";
                sub.textContent = "Strict clause-by-clause retrieval against API, ASME, AWS, ISO, and NACE codes.";
            } else {
                headline.textContent = "Ask an Expert";
                sub.textContent = "Rig-floor wisdom, OEM procedures (NOV, Cameron, Hydril), and veteran inspector SOPs.";
            }
        }

        function autoGrow(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
        }

        function handleInputKey(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }

        function sendQuickPrompt(text) {
            document.getElementById('user-input').value = text;
            sendMessage();
        }

        function resetChat() {
            document.getElementById('chat-window').style.display = 'none';
            document.getElementById('greeting-area').style.display = 'flex';
            document.getElementById('app-container').className = 'state-greeting';
            document.getElementById('messages-list').innerHTML = '';
            chatHistory = [];
        }

        // Gemini Monochrome Morphing Loading Status
        let statusInterval = null;
        function showStatusAnimation() {
            const container = document.getElementById('gemini-status-container');
            const phraseEl = document.getElementById('status-phrase-text');
            container.style.display = 'flex';
            
            const phrases = currentMode === 'expert' 
                ? ["Consulting OEM procedures...", "Checking failure hotspots...", "Compiling veteran SOP..."]
                : ["Analyzing query...", "Searching technical literature...", "Formulating response..."];
            
            let idx = 0;
            phraseEl.textContent = phrases[0];
            
            statusInterval = setInterval(() => {
                phraseEl.style.opacity = '0';
                setTimeout(() => {
                    idx = (idx + 1) % phrases.length;
                    phraseEl.textContent = phrases[idx];
                    phraseEl.style.opacity = '1';
                }, 300);
            }, 1800);
        }

        function hideStatusAnimation() {
            clearInterval(statusInterval);
            document.getElementById('gemini-status-container').style.display = 'none';
        }

        // Send Message Pipeline
        async function sendMessage(overrideText = null) {
            const input = document.getElementById('user-input');
            const text = (typeof overrideText === 'string') ? overrideText : input.value.trim();
            if (!text || isGenerating) return;

            // Transition from Greeting to Chat View
            document.getElementById('greeting-area').style.display = 'none';
            document.getElementById('chat-window').style.display = 'block';
            document.getElementById('app-container').className = 'state-chat';

            if (!overrideText) {
                input.value = '';
                input.style.height = 'auto';
            }

            appendMessage(text, 'user');
            isGenerating = true;
            updateSendButtonState(true);
            showStatusAnimation();

            try {
                const isArabic = anyArabic(text);
                const res = await fetch(\`\${API_BASE}/api/ask\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: text,
                        language: isArabic ? 'ar' : 'en',
                        session_id: sessionId,
                        standard_filter: currentMode === 'web' ? '🌐 GENERAL AI' : 'ALL',
                        mode: currentMode,
                        history: chatHistory.slice(-4)
                    })
                });

                hideStatusAnimation();
                const data = await res.json();
                
                if (data.error) throw new Error(data.error);

                appendMessage(data.answer, 'ai', data.sources, data.suggested_questions, data.can_continue);
                chatHistory.push({ role: 'user', content: text });
                chatHistory.push({ role: 'assistant', content: data.answer });

            } catch (err) {
                hideStatusAnimation();
                appendMessage(\`Error: \${err.message}\`, 'ai');
            } finally {
                isGenerating = false;
                updateSendButtonState(false);
            }
        }

        function updateSendButtonState(generating) {
            const btn = document.getElementById('send-btn');
            if (generating) {
                btn.classList.add('stop-mode');
                btn.innerHTML = '<span style="font-size:0.8rem;">■</span>';
                btn.title = "Stop";
            } else {
                btn.classList.remove('stop-mode');
                btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
                btn.title = "Send";
            }
        }

        function anyArabic(str) {
            return /[\\u0600-\\u06FF]/.test(str);
        }

        // Append Message with Action Toolbar & Follow-Ups
        function appendMessage(text, role, sources = [], followups = [], canContinue = false) {
            const list = document.getElementById('messages-list');
            const row = document.createElement('div');
            row.className = \`message-row \${role}\`;

            const avatar = document.createElement('div');
            avatar.className = \`avatar-box \${role}-avatar\`;
            avatar.innerHTML = role === 'user' ? '👤' : '<span class="sparkle-icon" style="font-size:1rem;">✦</span>';

            const body = document.createElement('div');
            body.className = 'message-body';
            
            if (role === 'ai') {
                body.innerHTML = marked.parse(text);

                // Sources Accordion
                if (sources && sources.length > 0) {
                    const srcBox = document.createElement('details');
                    srcBox.className = 'sources-accordion';
                    let listItems = sources.map(s => \`<li><strong>\${s.standard}</strong>: \${s.clause}</li>\`).join('');
                    srcBox.innerHTML = \`<summary>📖 Verified Sources Cited (\${sources.length})</summary><ul>\${listItems}</ul>\`;
                    body.appendChild(srcBox);
                }

                // Continue Generating Button
                if (canContinue) {
                    const contBtn = document.createElement('button');
                    contBtn.className = 'continue-btn';
                    contBtn.innerHTML = '▶ Continue generating...';
                    contBtn.onclick = () => {
                        contBtn.remove();
                        sendMessage("Continue from exactly where you left off, preserving complete technical continuity.");
                    };
                    body.appendChild(contBtn);
                }

                // Suggested Next Question Chips
                if (followups && followups.length > 0) {
                    const chipsWrap = document.createElement('div');
                    chipsWrap.className = 'followups-container';
                    followups.forEach(q => {
                        const chip = document.createElement('div');
                        chip.className = 'followup-chip';
                        chip.innerHTML = \`↗ \${q}\`;
                        chip.onclick = () => sendMessage(q);
                        chipsWrap.appendChild(chip);
                    });
                    body.appendChild(chipsWrap);
                }

                // Action Toolbar (Copy, Upvote, Downvote, Export NCR)
                const toolbar = document.createElement('div');
                toolbar.className = 'response-toolbar';
                toolbar.innerHTML = \`
                    <button class="tool-btn" onclick="copyAnswer(this, \\\`\${encodeURIComponent(text)}\\\`)">📋 Copy</button>
                    <button class="tool-btn" onclick="alert('Thank you for your feedback!')">👍</button>
                    <button class="tool-btn" onclick="alert('Feedback noted for engineering review.')">👎</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(text)}\\\`)">📑 Export NCR</button>
                \`;
                body.appendChild(toolbar);
            } else {
                body.textContent = text;
            }

            row.appendChild(avatar);
            row.appendChild(body);
            list.appendChild(row);

            const chatWindow = document.getElementById('chat-window');
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function copyAnswer(btn, encodedText) {
            const raw = decodeURIComponent(encodedText);
            navigator.clipboard.writeText(raw).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = '✓ Copied!';
                setTimeout(() => btn.innerHTML = orig, 2000);
            });
        }

        function exportNCR(encodedText) {
            const raw = decodeURIComponent(encodedText);
            const ncrWindow = window.open('', '_blank');
            ncrWindow.document.write(\`
                <html><head><title>Non-Conformance Report (NCR)</title><style>body{font-family:sans-serif; padding:30px;} pre{background:#f5f5f5; padding:15px; border-radius:8px;}</style></head>
                <body>
                    <h2>NON-CONFORMANCE REPORT (NCR) - QUALITY DEPARTMENT</h2>
                    <p><strong>Report Date:</strong> \${new Date().toLocaleDateString()}</p>
                    <p><strong>Inspection Scope:</strong> Oilfield Equipment & Welding Quality</p>
                    <hr>
                    <pre>\${raw}</pre>
                    <br><button onclick="window.print()">Print NCR Document</button>
                </body></html>
            \`);
        }

        // Voice Input Recognition
        function setupSpeech() {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
                speechRecognition = new SpeechRec();
                speechRecognition.continuous = false;
                speechRecognition.interimResults = false;
                speechRecognition.onresult = (e) => {
                    const transcript = e.results[0][0].transcript;
                    document.getElementById('user-input').value = transcript;
                    document.getElementById('mic-btn').classList.remove('recording');
                    autoGrow(document.getElementById('user-input'));
                };
                speechRecognition.onerror = () => document.getElementById('mic-btn').classList.remove('recording');
                speechRecognition.onend = () => document.getElementById('mic-btn').classList.remove('recording');
            }
        }

        function toggleVoiceInput() {
            if (!speechRecognition) return alert("Speech recognition not supported in this browser.");
            const mic = document.getElementById('mic-btn');
            if (mic.classList.contains('recording')) {
                speechRecognition.stop();
                mic.classList.remove('recording');
            } else {
                speechRecognition.start();
                mic.classList.add('recording');
            }
        }

        function forceCachePurge() {
            if ('caches' in window) {
                caches.keys().then(names => names.forEach(name => caches.delete(name)));
            }
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
            }
            localStorage.removeItem('inspecta_session');
            window.location.reload(true);
        }

        function toggleAttachmentMenu() {
            const popup = document.getElementById('attach-popup');
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        }
        function hideAttachmentMenu() {
            document.getElementById('attach-popup').style.display = 'none';
        }

        // Modals
        function openVisionModal() { document.getElementById('vision-modal').style.display = 'flex'; }
        function closeVisionModal() { document.getElementById('vision-modal').style.display = 'none'; }
        function openStandardsModal() { document.getElementById('standards-modal').style.display = 'flex'; }
        function closeStandardsModal() { document.getElementById('standards-modal').style.display = 'none'; }
        function toggleAdminPanel() {
            const p = document.getElementById('admin-panel');
            p.style.display = p.style.display === 'none' ? 'block' : 'none';
        }

        // ==========================================
        // 100% ON-DEVICE COMPUTER VISION ENGINE
        // ==========================================
        let loadedImg = null;
        function loadVisionImage(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    loadedImg = img;
                    const canvas = document.getElementById('defect-canvas');
                    canvas.width = img.width; canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    document.getElementById('canvas-placeholder').style.display = 'none';
                    runDefectMeasurement();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function runDefectMeasurement() {
            if (!loadedImg) return;
            const canvas = document.getElementById('defect-canvas');
            const ctx = canvas.getContext('2d');
            ctx.drawImage(loadedImg, 0, 0);

            const scalePxPerMm = parseFloat(document.getElementById('calib-scale').value) || 15;
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // Simple fast client-side thresholding for dark pit/crack indications
            let pitPixelCount = 0;
            let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i], g = data[i+1], b = data[i+2];
                const brightness = (r + g + b) / 3;
                if (brightness < 60) { // Dark pit or crack defect
                    pitPixelCount++;
                    const pixelIdx = i / 4;
                    const x = pixelIdx % canvas.width;
                    const y = Math.floor(pixelIdx / canvas.width);
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }

            const totalPixels = canvas.width * canvas.height;
            const areaLossPercent = ((pitPixelCount / totalPixels) * 100).toFixed(2);
            const boxWidthMm = ((maxX - minX) / scalePxPerMm).toFixed(1);
            const boxHeightMm = ((maxY - minY) / scalePxPerMm).toFixed(1);
            const maxDimensionMm = Math.max(boxWidthMm, boxHeightMm);
            const isLinearCrack = (Math.max(boxWidthMm, boxHeightMm) / (Math.min(boxWidthMm, boxHeightMm) || 1)) > 3.0;

            // Draw defect detection overlay box
            ctx.strokeStyle = '#EA4335';
            ctx.lineWidth = 3;
            ctx.strokeRect(minX, minY, (maxX - minX), (maxY - minY));
            ctx.fillStyle = '#EA4335';
            ctx.font = '16px Inter, sans-serif';
            ctx.fillText(isLinearCrack ? \`Crack: \${maxDimensionMm}mm\` : \`Pits: \${areaLossPercent}%\`, minX, Math.max(minY - 8, 18));

            lastVisionMetrics = {
                type: isLinearCrack ? 'Linear Crack' : 'Corrosion Pitting',
                maxDimensionMm,
                areaLossPercent,
                boxWidthMm,
                boxHeightMm
            };

            const summaryEl = document.getElementById('vision-result-summary');
            document.getElementById('vision-metrics-card').style.display = 'block';
            summaryEl.innerHTML = \`
                <div><span class="metric-badge \${maxDimensionMm > 0 ? 'badge-reject' : 'badge-accept'}">\${lastVisionMetrics.type}</span></div>
                <div style="margin-top:6px;"><strong>Max Measured Dimension:</strong> \${maxDimensionMm} mm</div>
                <div><strong>Surface Area Loss:</strong> \${areaLossPercent}% (ASTM G46)</div>
                <div><strong>Aspect Ratio:</strong> \${(maxDimensionMm / (Math.min(boxWidthMm, boxHeightMm) || 1)).toFixed(1)} (\${isLinearCrack ? 'Linear Indication' : 'Rounded Indication'})</div>
            \`;
        }

        function injectVisionToChat() {
            if (!lastVisionMetrics) return;
            closeVisionModal();
            const query = \`We measured a defect on site using our optical gauge: Defect Type: \${lastVisionMetrics.type}, Measured Dimension: \${lastVisionMetrics.maxDimensionMm} mm, Surface Area Loss: \${lastVisionMetrics.areaLossPercent}%. Is this acceptable under the relevant code (API 1104 / ASME B31.3 / API 5CT)?\`;
            sendMessage(query);
        }

        // ==========================================
        // SMART PDF INGESTION & HASH DEDUPLICATION
        // ==========================================
        async function handleSmartPDFUpload(file) {
            if (!file) return;
            const logBox = document.getElementById('hub-log');
            logBox.style.display = 'block';
            logBox.innerHTML = \`<div>[1/4] Calculating cryptographic SHA-256 fingerprint...</div>\`;

            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            logBox.innerHTML += \`<div>[2/4] Checking server deduplication registry: \${fileHash.substring(0, 16)}...</div>\`;

            // Query server if document already exists
            const checkRes = await fetch(\`\${API_BASE}/api/admin/check-hash\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_hash: fileHash })
            });
            const checkData = await checkRes.json();

            if (checkData.exists) {
                logBox.innerHTML += \`<div style="color:#60A5FA;">⚡ Document recognized: \${checkData.doc.standard_code} - \${checkData.doc.title}!</div>\`;
                logBox.innerHTML += \`<div style="color:#34D399;">✓ Instant activation from server cache with 0 compute cost!</div>\`;
                return;
            }

            logBox.innerHTML += \`<div>[3/4] New document. Parsing pages with client-side PDF.js...</div>\`;
            const code = document.getElementById('hub-std-code').value.trim() || file.name.replace('.pdf', '');
            const name = document.getElementById('hub-std-name').value.trim() || 'Uploaded Specification';
            const scope = document.querySelector('input[name="hub-scope"]:checked').value;
            const token = document.getElementById('admin-token').value.trim();

            if (!token) {
                logBox.innerHTML += \`<div style="color:#EF4444;">Error: Please enter Admin Secret Token in Settings first!</div>\`;
                return;
            }

            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
            logBox.innerHTML += \`<div>Loaded \${pdf.numPages} pages. Uploading chunks with 768-d embeddings...</div>\`;

            let currentContent = "";
            let chunkCount = 0;

            for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const text = textContent.items.map(item => item.str).join(" ");
                currentContent += text + " ";

                while (currentContent.length > 1000) {
                    let splitIdx = currentContent.indexOf(". ", 800);
                    if (splitIdx === -1) splitIdx = 1000;
                    const chunkText = currentContent.substring(0, splitIdx + 1).trim();
                    currentContent = currentContent.substring(splitIdx + 1);
                    chunkCount++;

                    await fetch(\`\${API_BASE}/api/admin/ingest\`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': \`Bearer \${token}\`
                        },
                        body: JSON.stringify({
                            standard_code: code,
                            standard_name: name,
                            section: \`Page \${i}\`,
                            clause: \`Chunk \${chunkCount}\`,
                            content: chunkText,
                            file_hash: fileHash,
                            scope: scope,
                            session_id: sessionId,
                            is_temporary: scope === 'private_temp'
                        })
                    });
                }
            }
            logBox.innerHTML += \`<div style="color:#34D399;">✓ Ingested \${chunkCount} chunks successfully!</div>\`;
        }

        // Admin Config Save
        function toggleProviderSettings() {
            const p = document.getElementById('active-provider').value;
            document.getElementById('cf-settings').style.display = p === 'cloudflare' ? 'block' : 'none';
            document.getElementById('groq-settings').style.display = p === 'groq' ? 'block' : 'none';
            document.getElementById('or-settings').style.display = p === 'openrouter' ? 'block' : 'none';
        }

        async function saveAdminConfig() {
            const token = document.getElementById('admin-token').value.trim();
            if (!token) return alert("Please enter Admin Secret Token.");
            const prov = document.getElementById('active-provider').value;
            const cfModel = document.getElementById('model-cloudflare').value;
            const groqKey = document.getElementById('key-groq').value;
            const orKey = document.getElementById('key-openrouter').value;
            const orModel = document.getElementById('model-openrouter').value;

            const res = await fetch(\`\${API_BASE}/api/admin/config\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                body: JSON.stringify({
                    active_provider: prov,
                    cloudflare_model: cfModel,
                    groq_api_key: groqKey,
                    openrouter_api_key: orKey,
                    openrouter_model: orModel
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Configuration saved successfully!");
                toggleAdminPanel();
            } else {
                alert("Error: " + data.error);
            }
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('index.html', htmlContent, 'utf8');
console.log('Successfully generated complete Google Gemini UI in index.html');
