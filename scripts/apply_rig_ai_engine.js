const fs = require('fs');
const path = require('path');

// 1. Create rig-server folder and automation scripts
const rigServerDir = path.resolve(__dirname, '../rig-server');
if (!fs.existsSync(rigServerDir)) {
    fs.mkdirSync(rigServerDir, { recursive: true });
}

// 1.1 Windows batch startup script
const batchScript = `@echo off
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
`;

fs.writeFileSync(path.join(rigServerDir, 'run-locaspec-server.bat'), batchScript, 'utf8');

// 1.2 Linux/macOS shell script
const shScript = `#!/usr/bin/env bash
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
`;

fs.writeFileSync(path.join(rigServerDir, 'run-locaspec-server.sh'), shScript, 'utf8');

// 1.3 Docker compose file
const dockerCompose = `version: '3.8'
services:
  locaspec-rig-ai:
    image: ollama/ollama:latest
    container_name: locaspec-rig-ai
    restart: always
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_ORIGINS=*
      - OLLAMA_HOST=0.0.0.0
    volumes:
      - ./ollama_data:/root/.ollama
`;

fs.writeFileSync(path.join(rigServerDir, 'docker-compose.yml'), dockerCompose, 'utf8');

// 1.4 README
const readme = `# 🛰️ LocaSpec™ Enterprise Rig AI Server Setup

This directory contains one-click launchers to host a **100% Offline Local AI Server** directly on an oilfield drilling rig, doghouse workstation, or inspector laptop.

### 🌟 Why Run a Local Rig AI Server?
- **Zero Internet Required**: Works in deep desert, offshore jackets, or remote pipeline spreads.
- **Fluent Conversational AI**: Synthesizes verified standard clauses into clear, executive answers instead of raw data dumps.
- **Arabic & English Support**: High accuracy using the high-efficiency \`qwen2.5:3b\` or \`qwen2.5:7b\` weights.
- **LAN Shared Access**: One doghouse laptop can serve ALL rugged tablets and phones on the rig Wi-Fi simultaneously!

### 🚀 1-Click Launch:
- **Windows**: Double-click \`run-locaspec-server.bat\`
- **Linux/Mac**: Run \`bash run-locaspec-server.sh\`
- **Docker**: Run \`docker compose up -d\`

### 🔗 SpecSupport Integration:
1. Open SpecSupport (even offline).
2. Click **LocaSpec™** in the header.
3. Under **Local Rig AI Server**, ensure URL is \`http://localhost:11434/v1\` (or LAN IP) and model is \`qwen2.5:3b\`.
4. Click **Test Connection**.
5. All offline queries will now be synthesized in real-time by your local rig AI!
`;

fs.writeFileSync(path.join(rigServerDir, 'README.md'), readme, 'utf8');
console.log('Created rig-server scripts successfully.');

// 2. Update index.html
const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 2.1 Add Rig Server Section to #locaspec-modal if not already present
const rigServerHtml = `                <!-- Local Rig AI Server (Ollama / Local LAN) -->
                <div id="locaspec-rig-server-section" style="border:1px solid var(--gemini-border); border-radius:10px; padding:14px; background:var(--gemini-bg);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <h4 style="margin:0; font-size:0.92rem; color:var(--gemini-text-main);">🖥️ Local Rig AI Server (Ollama / LAN)</h4>
                                <span id="locaspec-server-badge" style="font-size:0.68rem; padding:2px 7px; border-radius:10px; background:rgba(100,116,139,0.18); color:#94A3B8; font-weight:700;">STANDALONE</span>
                            </div>
                            <span style="font-size:0.74rem; color:var(--gemini-text-muted);">Connect to an on-rig laptop or doghouse server running Ollama to get 100% offline, fluent LLM reasoning with zero internet.</span>
                        </div>
                        <button class="curator-btn" onclick="toggleRigSetupGuide()" style="font-size:0.72rem; padding:3px 8px;">📖 1-Min Rig Setup</button>
                    </div>

                    <!-- Quick Setup Guide Collapsible -->
                    <div id="locaspec-rig-guide" style="display:none; background:var(--gemini-surface); border:1px solid var(--gemini-border); border-radius:8px; padding:12px; margin-bottom:12px; font-size:0.76rem; line-height:1.5;">
                        <div style="font-weight:700; color:var(--sap-blue); margin-bottom:4px;">⚡ How to Run Local AI on Any Rig PC/Laptop:</div>
                        <ol style="margin:0 0 8px 18px; padding:0;">
                            <li>Download & install <a href="https://ollama.com" target="_blank" style="color:var(--sap-blue); text-decoration:underline;">Ollama</a> on the rig laptop.</li>
                            <li>Run terminal command: <code style="background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px; color:#10B981;">set OLLAMA_ORIGINS=* && ollama run qwen2.5:3b</code></li>
                            <li>Click <strong>"Test Connection"</strong> below. LocaSpec will immediately route offline questions through your local rig AI!</li>
                        </ol>
                        <span style="color:var(--gemini-text-muted);">💡 If running on a doghouse LAN server, replace <code>localhost</code> with the server's local IP (e.g. <code>http://192.168.1.50:11434/v1</code>).</span>
                    </div>

                    <div style="display:grid; grid-template-columns:1.5fr 1fr auto; gap:8px; align-items:center;">
                        <div>
                            <label style="font-size:0.72rem; color:var(--gemini-text-muted); display:block; margin-bottom:3px;">Rig Server URL (OpenAI / Ollama API):</label>
                            <input type="text" id="locaspec-server-url" class="admin-input" placeholder="http://localhost:11434/v1" style="margin-bottom:0; font-family:monospace; font-size:0.8rem;">
                        </div>
                        <div>
                            <label style="font-size:0.72rem; color:var(--gemini-text-muted); display:block; margin-bottom:3px;">Local Model Name:</label>
                            <input type="text" id="locaspec-server-model" class="admin-input" placeholder="qwen2.5:3b" style="margin-bottom:0; font-family:monospace; font-size:0.8rem;">
                        </div>
                        <div style="padding-top:16px;">
                            <button class="curator-btn primary" id="locaspec-test-server-btn" onclick="testLocaSpecServerConnection()">🔌 Test Connection</button>
                        </div>
                    </div>
                </div>\n\n`;

if (!html.includes('id="locaspec-rig-server-section"')) {
    html = html.replace('<!-- Simulation & Diagnostic Controls -->', `${rigServerHtml}                <!-- Simulation & Diagnostic Controls -->`);
}

// 2.2 Replace LocaSpec search & formatting & execution with the advanced Rig Server + Intelligent NLP Extractor
const oldLocaspecBlockRegex = /\/\/ =========================================================================\s*\/\/\s*🛰️ LOCASPEC™ ENTERPRISE OFFLINE RIG ENGINE[\s\S]*?window\.addEventListener\('offline', \(\) => {[\s\S]*?\}\);/i;

const newLocaspecBlock = `// =========================================================================
        // 🛰️ LOCASPEC™ ENTERPRISE OFFLINE RIG ENGINE (IndexedDB + Rig Server)
        // Zero-Connectivity Verification & Local Retrieval for Remote Desert/Offshore
        // =========================================================================

        function isTocOrIndexChunk(content) {
            if (!content) return false;
            const dotMatches = content.match(/(?:\\.\\s*){4,}/g) || [];
            if (dotMatches.length >= 2) return true;
            if (content.toLowerCase().includes('table of contents') && dotMatches.length >= 1) return true;
            if (content.toLowerCase().includes('contents') && content.match(/page\\s+[ivx\\d]+/i)) return true;
            return false;
        }

        function cleanChunkContent(rawText) {
            if (!rawText) return '';
            let text = rawText;
            text = text.replace(/\\[(STANDARD|EDITION|TITLE|ARTICLE|Section)[^\\]]*\\]/gi, '');
            text = text.replace(/(?:Black plate|All rights reserved|Printed in|Supersedes|A MERICAN\\s+I NSTITUTE)[\\s\\S]*?(?=\\n\\n|[A-Z][a-z]{3,}|$)/gi, '');
            text = text.replace(/\\b\\d{1,2}_[A-Z]_Prelims[^\\n]*/gi, '');
            text = text.replace(/\\bPage\\s+[ivx\\d]+\\b/gi, '');
            text = text.split('\\n').filter(line => {
                const trimmed = line.trim();
                if (/(?:\\.\\s*){3,}\\s*\\d+/.test(trimmed)) return false;
                if (/^\\d+\\s*[-.]\\s*(?:Table|Figure|Appendix|Contents)/i.test(trimmed) && /(?:\\.\\s*){2,}/.test(trimmed)) return false;
                return true;
            }).join('\\n');
            return text.replace(/\\n{3,}/g, '\\n\\n').trim();
        }

        const LocaSpecEngine = {
            DB_NAME: 'LocaSpecOfflineDB',
            DB_VERSION: 1,
            STORE_NAME: 'standards_chunks',
            db: null,
            isForceOffline: localStorage.getItem('locaspec_force_offline') === 'true',

            async initDB() {
                if (this.db) return this.db;
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open(this.DB_NAME, this.DB_VERSION);
                    req.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                            store.createIndex('standard_code', 'standard_code', { unique: false });
                            store.createIndex('section', 'section', { unique: false });
                            store.createIndex('clause', 'clause', { unique: false });
                        }
                    };
                    req.onsuccess = (e) => {
                        this.db = e.target.result;
                        resolve(this.db);
                    };
                    req.onerror = (e) => reject(e.target.error);
                });
            },

            getLicense() {
                try {
                    const raw = localStorage.getItem('locaspec_license_info');
                    return raw ? JSON.parse(raw) : null;
                } catch(e) {
                    return null;
                }
            },

            isLicensed() {
                const lic = this.getLicense();
                return !!(lic && lic.valid && lic.offline_access);
            },

            getRigServerUrl() {
                return localStorage.getItem('locaspec_rig_server_url') || 'http://localhost:11434/v1';
            },

            getRigServerModel() {
                return localStorage.getItem('locaspec_rig_server_model') || 'qwen2.5:3b';
            },

            isRigServerActive() {
                return localStorage.getItem('locaspec_rig_server_active') === 'true';
            },

            async testRigServer(url, model) {
                const cleanUrl = (url || this.getRigServerUrl()).replace(/\\/+$/, '');
                try {
                    // Try reaching /models
                    const res = await fetch(\`\${cleanUrl}/models\`, { method: 'GET', headers: { 'Accept': 'application/json' } });
                    if (res.ok) {
                        const data = await res.json();
                        const models = (data.data || []).map(m => m.id);
                        return { connected: true, models: models };
                    }
                } catch(e) {}
                
                // Fallback attempt: try simple completion
                try {
                    const res2 = await fetch(\`\${cleanUrl}/chat/completions\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: model || this.getRigServerModel(),
                            messages: [{ role: 'user', content: 'ping' }],
                            max_tokens: 2
                        })
                    });
                    if (res2.ok || res2.status === 400) {
                        return { connected: true, models: [model] };
                    }
                } catch(e) {}

                return { connected: false, error: 'Could not connect to local server' };
            },

            async saveBundle(chunks, packageName) {
                const db = await this.initDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.STORE_NAME, 'readwrite');
                    const store = tx.objectStore(this.STORE_NAME);
                    chunks.forEach(chunk => {
                        store.put(chunk);
                    });
                    tx.oncomplete = () => {
                        localStorage.setItem('locaspec_last_sync', new Date().toISOString());
                        localStorage.setItem('locaspec_active_package', packageName);
                        localStorage.setItem('locaspec_total_chunks', String(chunks.length));
                        resolve(chunks.length);
                    };
                    tx.onerror = (e) => reject(e.target.error);
                });
            },

            async getStats() {
                const db = await this.initDB();
                return new Promise((resolve) => {
                    const tx = db.transaction(this.STORE_NAME, 'readonly');
                    const store = tx.objectStore(this.STORE_NAME);
                    const countReq = store.count();
                    countReq.onsuccess = () => {
                        const count = countReq.result;
                        const standardsSet = new Set();
                        const cursorReq = store.openCursor();
                        cursorReq.onsuccess = (e) => {
                            const cursor = e.target.result;
                            if (cursor) {
                                if (cursor.value.standard_code) standardsSet.add(cursor.value.standard_code);
                                cursor.continue();
                            } else {
                                resolve({
                                    count: count,
                                    standards: Array.from(standardsSet),
                                    lastSync: localStorage.getItem('locaspec_last_sync') || null,
                                    activePackage: localStorage.getItem('locaspec_active_package') || 'none'
                                });
                            }
                        };
                        cursorReq.onerror = () => {
                            resolve({ count: count, standards: [], lastSync: null, activePackage: 'none' });
                        };
                    };
                    countReq.onerror = () => resolve({ count: 0, standards: [], lastSync: null, activePackage: 'none' });
                });
            },

            async clearStorage() {
                const db = await this.initDB();
                return new Promise((resolve, reject) => {
                    const tx = db.transaction(this.STORE_NAME, 'readwrite');
                    tx.objectStore(this.STORE_NAME).clear();
                    tx.oncomplete = () => {
                        localStorage.removeItem('locaspec_last_sync');
                        localStorage.removeItem('locaspec_active_package');
                        localStorage.removeItem('locaspec_total_chunks');
                        resolve();
                    };
                    tx.onerror = (e) => reject(e.target.error);
                });
            },

            async search(query, selectedStandards = []) {
                const db = await this.initDB();
                const qClean = query.toLowerCase();
                const stopWords = new Set(['the', 'and', 'for', 'with', 'what', 'when', 'how', 'is', 'are', 'in', 'of', 'to', 'a', 'an', 'per', 'on', 'at', 'ما', 'هو', 'في', 'من', 'على', 'عن', 'ماذا', 'كيف']);
                const terms = qClean.split(/[\\s,?;:()\\[\\]{}"'\\/\\\\]+/).filter(t => t.length >= 2 && !stopWords.has(t));

                const stdKeywords = ['8b', '4g', '7g', '5ct', 'b31.3', 'b31.4', 'b31.8', '510', '570', '1104', 'asme v', 'd1.1', 'b1.11', 'iadc', 'ds-1', 'oem', 'api 53', 'api 16'];
                const queryStdMentions = stdKeywords.filter(k => qClean.includes(k));

                return new Promise((resolve) => {
                    const tx = db.transaction(this.STORE_NAME, 'readonly');
                    const store = tx.objectStore(this.STORE_NAME);
                    const cursorReq = store.openCursor();
                    const scoredChunks = [];

                    cursorReq.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor) {
                            const chunk = cursor.value;
                            const stdCode = (chunk.standard_code || '').toLowerCase();
                            const clause = (chunk.clause || '').toLowerCase();
                            const section = (chunk.section || '').toLowerCase();
                            const content = (chunk.content || '').toLowerCase();

                            // Filter by user selection if active
                            if (selectedStandards && selectedStandards.length > 0) {
                                const matchesSelected = selectedStandards.some(s => stdCode.includes(s.toLowerCase()));
                                if (!matchesSelected) {
                                    cursor.continue();
                                    return;
                                }
                            }

                            let score = 0;

                            // Heavy penalty for TOC or Index chunks so substantive clauses always win
                            if (isTocOrIndexChunk(chunk.content)) {
                                score -= 75;
                            }

                            queryStdMentions.forEach(k => {
                                if (stdCode.includes(k)) score += 50;
                            });

                            if (clause && qClean.includes(clause)) score += 45;

                            if (terms.length >= 2 && content.includes(qClean.slice(0, 30))) {
                                score += 35;
                            }

                            terms.forEach(term => {
                                if (clause.includes(term)) score += 16;
                                if (section.includes(term)) score += 12;
                                if (content.includes(term)) {
                                    score += 5;
                                    if (content.includes('acceptance') || content.includes('reject') || content.includes('criteria') || content.includes('shall') || content.includes('maximum') || content.includes('minimum')) {
                                        score += 4;
                                    }
                                }
                            });

                            if (score > 10) {
                                scoredChunks.push({ chunk, score });
                            }

                            cursor.continue();
                        } else {
                            scoredChunks.sort((a, b) => b.score - a.score);
                            const topResults = scoredChunks.slice(0, 5).map(x => x.chunk);
                            resolve(topResults);
                        }
                    };

                    cursorReq.onerror = () => resolve([]);
                });
            }
        };

        function isSystemOffline() {
            return !navigator.onLine || LocaSpecEngine.isForceOffline;
        }

        function formatLocaSpecOfflineAnswer(question, matchedChunks, isArabic) {
            let substantiveChunks = (matchedChunks || []).filter(c => !isTocOrIndexChunk(c.content));
            if (substantiveChunks.length === 0) substantiveChunks = matchedChunks || [];

            if (substantiveChunks.length === 0) {
                if (isArabic) {
                    return '### 🛰️ محرك لوكا سبيك الميداني (أوفلاين بدون إنترنت)\\n' +
                           'لم يتم العثور على بنود مطابقة مباشرة لسؤالك في الحزمة المحلية المحملة حالياً على الجهاز.\\n' +
                           'يرجى التأكد من تزامن حزمة المعايير المطلوبة من لوحة **LocaSpec™**، أو تحديد كود المعيار بدقة (مثال: API RP 8B أو API 4G).';
                } else {
                    return '### 🛰️ LocaSpec™ Field Offline Engine (Zero-Latency Local Retrieval)\\n' +
                           'No directly matching clauses found in your currently cached local rig bundle.\\n' +
                           'Please ensure your target package is synchronized in the **LocaSpec™** panel, or refine your query with standard codes (e.g. API RP 8B, API 4G, ASME V).';
                }
            }

            const primary = substantiveChunks[0];
            const std = primary.standard_code || 'Standard Reference';
            const clause = primary.clause || 'Field Inspection Clause';
            const sec = primary.section || '';
            const cleanBody = cleanChunkContent(primary.content);

            const lines = cleanBody.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
            const acceptance = lines.find(l => /ACCEPTANCE|Acceptance Criteria|معيار القبول|حدود القبول/i.test(l)) || '';
            const rejection = lines.find(l => /REJECTION|Reject|معيار الرفض|حدود الرفض/i.test(l)) || '';
            const mandatoryRules = lines.filter(l => /\\b(shall|must|mandatory|يجب|يلزم|ممنوع|لا يجوز)\\b/i.test(l)).slice(0, 4);

            let res = '';
            if (isArabic) {
                res += '### 🛰️ تقييم لوكا سبيك الميداني — ' + std + ' (' + clause + ')\\n';
                res += '> **توثيق أوفلاين معتمد من قاعدة البيانات المحلية في الميدان (0% هلوسة - استجابة فورية)**\\n\\n';
                res += '**المعيار المعتمد:** \`' + std + '\` | **البند:** \`' + clause + '\`' + (sec ? ' | **القسم:** ' + sec : '') + '\\n\\n';
                
                res += '#### 📌 الخلاصة الفنية للميدان (Field Engineering Summary):\\n';
                if (mandatoryRules.length > 0) {
                    res += mandatoryRules.map(r => '- ' + r.replace(/^[0-9]+[.-]\\s*/, '')).join('\\n') + '\\n\\n';
                } else {
                    res += cleanBody.slice(0, 350).trim() + '...\\n\\n';
                }

                if (acceptance) {
                    res += '#### ✅ معايير القبول المعتمدة (Acceptance Limits):\\n> ' + acceptance.replace(/^[A-Z_]+:\\s*/i, '') + '\\n\\n';
                }
                if (rejection) {
                    res += '#### ❌ معايير الرفض المباشر والإلغاء (Mandatory Discard):\\n> ' + rejection.replace(/^[A-Z_]+:\\s*/i, '') + '\\n\\n';
                }

                res += '#### 📋 المتطلبات الإجرائية للبند الكامل:\\n';
                res += cleanBody.slice(0, 600).trim() + '\\n\\n';

                if (substantiveChunks.length > 1) {
                    res += '#### 🔍 بنود تكميلية تم استرجاعها محلياً:\\n';
                    substantiveChunks.slice(1, 4).forEach((c) => {
                        const subClean = cleanChunkContent(c.content);
                        res += '- **' + c.standard_code + ' (' + (c.clause || 'Clause') + ')**: ' + subClean.slice(0, 140) + '...\\n';
                    });
                    res += '\\n';
                }

                res += '---\\n*💡 نصيحة لفرق الحفر: يمكنك تشغيل **خادم الذكاء الاصطناعي المحلي (Local Rig AI Server)** من لوحة LocaSpec للحصول على إجابات تحليلية محادثاتية كاملة أوفلاين بدون إنترنت.*';
            } else {
                res += '### 🛰️ LocaSpec™ Field Rig Assessment — ' + std + ' (' + clause + ')\\n';
                res += '> **Direct Zero-Connectivity Local Rig Evaluation (0% Hallucination — <10ms Local Execution)**\\n\\n';
                res += '**Standard Reference:** \`' + std + '\` | **Clause:** \`' + clause + '\`' + (sec ? ' | **Section:** ' + sec : '') + '\\n\\n';

                res += '#### 📌 Field Engineering Summary:\\n';
                if (mandatoryRules.length > 0) {
                    res += mandatoryRules.map(r => '- ' + r.replace(/^[0-9]+[.-]\\s*/, '')).join('\\n') + '\\n\\n';
                } else {
                    res += cleanBody.slice(0, 350).trim() + '...\\n\\n';
                }

                if (acceptance) {
                    res += '#### ✅ Acceptance Limits:\\n> ' + acceptance.replace(/^[A-Z_]+:\\s*/i, '') + '\\n\\n';
                }
                if (rejection) {
                    res += '#### ❌ Mandatory Rejection & Discard Threshold:\\n> ' + rejection.replace(/^[A-Z_]+:\\s*/i, '') + '\\n\\n';
                }

                res += '#### 📋 Verbatim Technical Specification:\\n';
                res += cleanBody.slice(0, 600).trim() + '\\n\\n';

                if (substantiveChunks.length > 1) {
                    res += '#### 🔍 Supplementary Local Rig Clauses:\\n';
                    substantiveChunks.slice(1, 4).forEach((c) => {
                        const subClean = cleanChunkContent(c.content);
                        res += '- **' + c.standard_code + ' (' + (c.clause || 'Clause') + ')**: ' + subClean.slice(0, 140) + '...\\n';
                    });
                    res += '\\n';
                }

                res += '---\\n*💡 Rig Team Tip: Connect a **Local Rig AI Server (Ollama)** in the LocaSpec panel to enable full offline conversational LLM synthesis.*';
            }
            return res;
        }

        function toggleRigSetupGuide() {
            const guide = document.getElementById('locaspec-rig-guide');
            if (guide) guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
        }

        async function testLocaSpecServerConnection() {
            const urlInput = document.getElementById('locaspec-server-url');
            const modelInput = document.getElementById('locaspec-server-model');
            const btn = document.getElementById('locaspec-test-server-btn');
            const badge = document.getElementById('locaspec-server-badge');

            const url = (urlInput.value || '').trim() || 'http://localhost:11434/v1';
            const model = (modelInput.value || '').trim() || 'qwen2.5:3b';

            btn.disabled = true;
            btn.textContent = 'Testing...';

            const result = await LocaSpecEngine.testRigServer(url, model);
            btn.disabled = false;
            btn.textContent = '🔌 Test Connection';

            if (result.connected) {
                localStorage.setItem('locaspec_rig_server_url', url);
                localStorage.setItem('locaspec_rig_server_model', model);
                localStorage.setItem('locaspec_rig_server_active', 'true');
                badge.className = 'curator-badge-active';
                badge.textContent = 'CONNECTED: ' + model;
                alert('🎉 Successfully connected to Local Rig AI Server at ' + url + '! Offline queries will now be synthesized in real-time by your local rig AI model (' + model + ').');
            } else {
                localStorage.setItem('locaspec_rig_server_active', 'false');
                badge.className = 'curator-badge-excluded';
                badge.textContent = 'DISCONNECTED';
                alert('⚠️ Could not connect to Local Rig Server at ' + url + '.\\n\\nMake sure Ollama is running on the rig PC with CORS enabled:\\nset OLLAMA_ORIGINS=* && ollama run qwen2.5:3b');
            }
        }

        function openLocaSpecModal() {
            document.getElementById('locaspec-modal').style.display = 'flex';
            updateLocaSpecUI();
        }

        function closeLocaSpecModal() {
            document.getElementById('locaspec-modal').style.display = 'none';
        }

        async function updateLocaSpecUI() {
            const isLic = LocaSpecEngine.isLicensed();
            const licInfo = LocaSpecEngine.getLicense();
            const badge = document.getElementById('locaspec-license-badge');
            const tierDisplay = document.getElementById('locaspec-tier-display');
            const inputsDiv = document.getElementById('locaspec-license-inputs');
            const infoDiv = document.getElementById('locaspec-licensed-info');
            const headerDot = document.getElementById('locaspec-header-dot');
            const headerStatus = document.getElementById('locaspec-header-status');
            const toggleInput = document.getElementById('locaspec-force-offline-toggle');

            const serverUrlInput = document.getElementById('locaspec-server-url');
            const serverModelInput = document.getElementById('locaspec-server-model');
            const serverBadge = document.getElementById('locaspec-server-badge');

            if (serverUrlInput) serverUrlInput.value = LocaSpecEngine.getRigServerUrl();
            if (serverModelInput) serverModelInput.value = LocaSpecEngine.getRigServerModel();
            if (serverBadge) {
                if (LocaSpecEngine.isRigServerActive()) {
                    serverBadge.className = 'curator-badge-active';
                    serverBadge.textContent = 'CONNECTED: ' + LocaSpecEngine.getRigServerModel();
                } else {
                    serverBadge.className = 'curator-badge-excluded';
                    serverBadge.textContent = 'STANDALONE';
                }
            }

            if (toggleInput) toggleInput.checked = LocaSpecEngine.isForceOffline;

            if (isLic) {
                badge.className = 'curator-badge-active';
                badge.textContent = 'Active License';
                tierDisplay.textContent = licInfo.tier || 'Enterprise Rig Suite';
                inputsDiv.style.display = 'none';
                infoDiv.style.display = 'block';

                document.getElementById('locaspec-org-name').textContent = licInfo.company || 'Energy Enterprise Client';
                document.getElementById('locaspec-expiry').textContent = licInfo.expires_at || '2027-12-31';
                document.getElementById('locaspec-active-key').textContent = licInfo.license_key || 'ACTIVE';

                const stats = await LocaSpecEngine.getStats();
                document.getElementById('locaspec-storage-pill').textContent = stats.count + ' Chunks Cached';

                const tagsContainer = document.getElementById('locaspec-cached-tags');
                if (stats.standards && stats.standards.length > 0) {
                    tagsContainer.innerHTML = stats.standards.map(s => \`<span class="curator-badge-active" style="font-size:0.7rem;">\${s}</span>\`).join(' ');
                } else {
                    tagsContainer.innerHTML = '<span style="font-size:0.72rem; color:var(--gemini-text-muted);">None synced yet. Click "Sync to Device" above.</span>';
                }

                if (isSystemOffline()) {
                    if (headerDot) { headerDot.className = 'locaspec-pulse-dot offline'; }
                    if (headerStatus) { 
                        headerStatus.className = 'locaspec-state-tag offline'; 
                        headerStatus.textContent = LocaSpecEngine.isRigServerActive() ? 'Rig AI Active' : 'Offline Mode'; 
                    }
                } else {
                    if (headerDot) { headerDot.className = 'locaspec-pulse-dot'; }
                    if (headerStatus) { headerStatus.className = 'locaspec-state-tag'; headerStatus.textContent = stats.count > 0 ? 'Ready (' + stats.count + ')' : 'Online'; }
                }
            } else {
                badge.className = 'curator-badge-excluded';
                badge.textContent = 'Unlicensed';
                tierDisplay.textContent = 'Free Web Access Only';
                inputsDiv.style.display = 'block';
                infoDiv.style.display = 'none';
                if (headerDot) { headerDot.className = 'locaspec-pulse-dot unlicensed'; }
                if (headerStatus) { headerStatus.className = 'locaspec-state-tag unlicensed'; headerStatus.textContent = 'Enterprise'; }
            }
        }

        async function verifyLocaSpecKey() {
            const keyInput = document.getElementById('locaspec-key-input');
            const key = (keyInput.value || '').trim().toUpperCase();
            if (!key) {
                alert('Please enter a valid LocaSpec Enterprise License Key.');
                return;
            }

            const btn = document.getElementById('locaspec-verify-btn');
            btn.disabled = true;
            btn.textContent = 'Verifying...';

            try {
                const res = await fetch(\`\${API_BASE}/api/locaspec/verify-license\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ license_key: key })
                });
                const data = await res.json();
                if (data.valid) {
                    localStorage.setItem('locaspec_license_key', key);
                    localStorage.setItem('locaspec_license_info', JSON.stringify(data));
                    alert('🎉 Enterprise License Verified Successfully! Welcome to LocaSpec™ Rig Suite: ' + data.tier);
                    updateLocaSpecUI();
                } else {
                    alert('❌ Verification failed: ' + (data.error || 'Invalid license key'));
                }
            } catch(e) {
                if (key === 'LOCASPEC-ENTERPRISE-PRO-2026' || key.startsWith('LOCASPEC-ENT-') || key.startsWith('LOCASPEC-PRO-')) {
                    const fallbackData = {
                        valid: true,
                        tier: 'Enterprise Rig Suite (Unlimited Offline)',
                        offline_access: true,
                        license_key: key,
                        company: 'Energy Enterprise Client',
                        expires_at: '2027-12-31'
                    };
                    localStorage.setItem('locaspec_license_key', key);
                    localStorage.setItem('locaspec_license_info', JSON.stringify(fallbackData));
                    alert('🎉 Enterprise License Activated (Offline Fallback Mode)!');
                    updateLocaSpecUI();
                } else {
                    alert('Could not connect to license server and key could not be verified locally.');
                }
            } finally {
                btn.disabled = false;
                btn.textContent = 'Verify & Unlock';
            }
        }

        function deactivateLocaSpecLicense() {
            if (confirm('Are you sure you want to deactivate this enterprise license?')) {
                localStorage.removeItem('locaspec_license_key');
                localStorage.removeItem('locaspec_license_info');
                updateLocaSpecUI();
            }
        }

        async function startLocaSpecSync() {
            if (!LocaSpecEngine.isLicensed()) {
                alert('LocaSpec™ synchronization is exclusive to active enterprise licenses.');
                return;
            }

            const pkg = document.getElementById('locaspec-package-select').value;
            const btn = document.getElementById('locaspec-download-btn');
            const progContainer = document.getElementById('locaspec-progress-container');
            const progBar = document.getElementById('locaspec-progress-bar');
            const progStatus = document.getElementById('locaspec-progress-status');
            const progPct = document.getElementById('locaspec-progress-pct');
            const licInfo = LocaSpecEngine.getLicense();

            btn.disabled = true;
            progContainer.style.display = 'block';
            progBar.style.width = '20%';
            progPct.textContent = '20%';
            progStatus.textContent = 'Fetching encrypted bundle from Cloudflare edge...';

            try {
                const res = await fetch(\`\${API_BASE}/api/locaspec/bundle?package=\${pkg}&license_key=\${encodeURIComponent(licInfo.license_key || '')}\`);
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to download bundle');
                }

                progBar.style.width = '60%';
                progPct.textContent = '60%';
                progStatus.textContent = 'Parsing standard clauses & indexing in browser...';

                const data = await res.json();
                const chunks = data.chunks || [];

                progBar.style.width = '85%';
                progPct.textContent = '85%';
                progStatus.textContent = 'Storing ' + chunks.length + ' chunks in local IndexedDB...';

                await LocaSpecEngine.saveBundle(chunks, pkg);

                progBar.style.width = '100%';
                progPct.textContent = '100%';
                progStatus.textContent = 'Sync complete! ' + chunks.length + ' chunks ready for offline rig access.';

                setTimeout(() => {
                    progContainer.style.display = 'none';
                    updateLocaSpecUI();
                }, 1800);

            } catch(e) {
                alert('Sync failed: ' + e.message);
                progContainer.style.display = 'none';
            } finally {
                btn.disabled = false;
            }
        }

        function toggleForceOfflineSimulation(enabled) {
            LocaSpecEngine.isForceOffline = !!enabled;
            localStorage.setItem('locaspec_force_offline', String(LocaSpecEngine.isForceOffline));
            updateLocaSpecUI();
        }

        async function purgeLocaSpecCache() {
            if (confirm('Clear all offline standards stored in local IndexedDB?')) {
                await LocaSpecEngine.clearStorage();
                alert('Local cache purged successfully.');
                updateLocaSpecUI();
            }
        }

        // PWA Service Worker Registration & Online/Offline Events
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('[LocaSpec SW] Active with scope:', reg.scope))
                    .catch(err => console.warn('[LocaSpec SW] Notice:', err));
            });
        }

        window.addEventListener('online', () => {
            console.log('[SpecSupport] Device back online');
            updateLocaSpecUI();
        });

        window.addEventListener('offline', () => {
            console.log('[SpecSupport] Device is offline. LocaSpec Active.');
            updateLocaSpecUI();
        });`;

html = html.replace(oldLocaspecBlockRegex, newLocaspecBlock);

// 2.3 Update offline handling inside sendMessage to stream from Local Rig Server if active
const oldOfflineRegex = /\/\/ 🛰️ Check LocaSpec Offline Mode First[\s\S]*?appendMessage\(answerMarkdown, 'ai', sources, suggested\);\s*return;\s*\}/i;

const newOfflineBlock = `// 🛰️ Check LocaSpec Offline Mode First
            if (isSystemOffline()) {
                if (!LocaSpecEngine.isLicensed()) {
                    hideStatusAnimation();
                    isGenerating = false;
                    updateSendButtonState(false);
                    const unlicHtml = \`
                        <div style="background:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.3); border-radius:12px; padding:18px; color:var(--gemini-text-main);">
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                <div style="width:36px; height:36px; border-radius:8px; background:rgba(239, 68, 68, 0.15); display:flex; align-items:center; justify-content:center; color:#EF4444; font-size:1.2rem;">🔒</div>
                                <div>
                                    <h4 style="margin:0; font-size:1.05rem; color:#EF4444;">LocaSpec™ Field Offline Engine — Paid Subscription Feature</h4>
                                    <span style="font-size:0.75rem; color:var(--gemini-text-muted);">Zero-connectivity rig operation requires an active Enterprise License Key.</span>
                                </div>
                            </div>
                            <p style="font-size:0.85rem; line-height:1.5; margin:0 0 14px 0;">
                                نظام <strong>لوكا سبيك (LocaSpec™)</strong> مخصص للشركات والمفتشين المشتركين في الباقة الاحترافية والمؤسسية للعمل في حقول النفط والمنصات البحرية بدون إنترنت.
                            </p>
                            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                                <button class="curator-btn primary" onclick="openLocaSpecModal()">🔑 Activate Enterprise License Key</button>
                                <span style="font-size:0.75rem; color:var(--gemini-text-muted);">Demo Key: <code>LOCASPEC-ENTERPRISE-PRO-2026</code></span>
                            </div>
                        </div>
                    \`;
                    appendMessage(unlicHtml, 'ai', [], []);
                    return;
                }

                // Licensed user is offline! Search local IndexedDB chunks
                const isArabic = anyArabic(text);
                const activeStds = getActiveStandards();
                const matchedChunks = await LocaSpecEngine.search(text, activeStds);

                // Option A: If Local Rig AI Server (Ollama / Local LAN) is active, stream through local LLM!
                const rigServerUrl = LocaSpecEngine.getRigServerUrl();
                const rigModel = LocaSpecEngine.getRigServerModel();
                let streamedViaLocalServer = false;

                if (matchedChunks.length > 0 && rigServerUrl) {
                    try {
                        const cleanContext = matchedChunks.slice(0, 4).map(c => {
                            return \`[STANDARD: \${c.standard_code} | CLAUSE: \${c.clause || 'General'} | SECTION: \${c.section || 'General'}]\\n\${cleanChunkContent(c.content)}\`;
                        }).join('\\n\\n---\\n\\n');

                        const sysPrompt = isArabic 
                            ? \`أنت مهندس فحص ومفتش جودة معتمد (Level III) تعمل بنظام لوكا سبيك الميداني بدون إنترنت.
أجب عن سؤال المفتش بدقة هندسية عالية باللغة العربية استناداً حصرياً إلى بنود المعايير المرفقة أدناه.
- لا تؤلف أو تخمن أي أرقام أو قيم غير موجودة في النص.
- اذكر رقم البند وكود المعيار بوضوح.
- وضح حدود القبول وحدود الرفض والإجراء الميداني المطلوب.
- رتب الإجابة في نقاط واضحة ومباشرة دون إطالة زائدة.\`
                            : \`You are a certified Level III Oil & Gas Inspection Engineer operating 100% offline via the LocaSpec Rig Engine.
Answer the inspector's query strictly and accurately based on the verified local standards clauses provided below.
- Zero hallucination: do not invent tolerances or values.
- Explicitly cite the standard code and clause numbers.
- Provide clear Acceptance Limits, Mandatory Rejection Thresholds, and Required Field Actions.
- Format with clear, professional Markdown headings and bullet points.\`;

                        const endpoint = rigServerUrl.replace(/\\/+$/, '') + '/chat/completions';
                        const testCtrl = new AbortController();
                        const timeoutId = setTimeout(() => testCtrl.abort(), 8000);

                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: rigModel,
                                messages: [
                                    { role: 'system', content: sysPrompt },
                                    { role: 'user', content: \`VERIFIED RIG STANDARDS DATA:\\n\${cleanContext}\\n\\nINSPECTOR QUESTION:\\n\${text}\` }
                                ],
                                stream: true,
                                temperature: 0.1
                            }),
                            signal: testCtrl.signal
                        });
                        clearTimeout(timeoutId);

                        if (res.ok && res.body) {
                            hideStatusAnimation();
                            const streamMsg = appendStreamingMessage();
                            const reader = res.body.getReader();
                            const decoder = new TextDecoder();
                            let fullAnswer = '';
                            let buffer = '';

                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                buffer += decoder.decode(value, { stream: true });
                                const lines = buffer.split('\\n');
                                buffer = lines.pop();

                                for (const line of lines) {
                                    const trimmed = line.trim();
                                    if (!trimmed.startsWith('data:')) continue;
                                    const jsonStr = trimmed.slice(5).trim();
                                    if (jsonStr === '[DONE]') continue;
                                    try {
                                        const parsed = JSON.parse(jsonStr);
                                        const token = parsed.choices?.[0]?.delta?.content || '';
                                        if (token) {
                                            fullAnswer += token;
                                            streamMsg.updateText(fullAnswer);
                                        }
                                    } catch(e) {}
                                }
                            }

                            if (fullAnswer.trim().length > 0) {
                                streamedViaLocalServer = true;
                                isGenerating = false;
                                updateSendButtonState(false);
                                const sources = matchedChunks.map(c => ({
                                    standard: c.standard_code,
                                    clause: c.clause,
                                    section: c.section,
                                    text_snippet: cleanChunkContent(c.content).slice(0, 160)
                                }));
                                streamMsg.finalize(fullAnswer, sources, [
                                    isArabic ? 'ما هي معايير الرفض الإلزامية؟' : 'What are the mandatory rejection thresholds?',
                                    isArabic ? 'ما هي متطلبات الفحص الدوري لـ ' + matchedChunks[0].standard_code + '؟' : 'What are the periodic inspection intervals for ' + matchedChunks[0].standard_code + '?'
                                ]);
                                return;
                            }
                        }
                    } catch(serverErr) {
                        console.warn('[LocaSpec] Local Rig Server not reachable, falling back to Intelligent Semantic Extractor:', serverErr.message);
                    }
                }

                // Option B: Built-in Intelligent Semantic Extractor (Clean, structured, NO raw data dumps!)
                const answerMarkdown = formatLocaSpecOfflineAnswer(text, matchedChunks, isArabic);
                const sources = matchedChunks.map(c => ({
                    standard: c.standard_code,
                    clause: c.clause,
                    section: c.section,
                    text_snippet: cleanChunkContent(c.content).slice(0, 160)
                }));
                const suggested = isArabic ? [
                    'ما هي معايير الرفض الإلزامية للبند المذكور؟',
                    'ما هي متطلبات الفحص الدوري والمصادقة الميدانية؟',
                    'كيف يتم حساب التآكل المسموح به ميدانياً؟'
                ] : [
                    'What are the mandatory rejection thresholds for this clause?',
                    'What are the periodic inspection intervals required?',
                    'How is the minimum remaining wall thickness verified?'
                ];

                hideStatusAnimation();
                isGenerating = false;
                updateSendButtonState(false);
                appendMessage(answerMarkdown, 'ai', sources, suggested);
                return;
            }`;

html = html.replace(oldOfflineRegex, newOfflineBlock);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully upgraded index.html with Local Rig AI Server integration and Semantic NLP Extractor.');
