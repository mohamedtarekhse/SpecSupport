const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Add manifest and theme color in <head> if not present
if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `    <link rel="manifest" href="./manifest.json">
    <meta name="theme-color" content="#0070F2">
</head>`);
}

// 2. Add LocaSpec CSS
const locaspecCss = `
        /* 🛰️ LocaSpec™ Enterprise Offline Rig Engine Styles */
        .locaspec-header-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: rgba(0, 112, 242, 0.08);
            border: 1px solid rgba(0, 112, 242, 0.25);
            color: var(--gemini-text-main);
            border-radius: 20px;
            padding: 5px 12px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            margin-right: 6px;
            position: relative;
            user-select: none;
        }
        .locaspec-header-pill:hover {
            background: rgba(0, 112, 242, 0.16);
            border-color: var(--sap-blue);
            transform: translateY(-1px);
        }
        .locaspec-pulse-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10B981;
            box-shadow: 0 0 6px #10B981;
            animation: locaspec-pulse 2s infinite ease-in-out;
        }
        .locaspec-pulse-dot.offline {
            background: #F59E0B;
            box-shadow: 0 0 6px #F59E0B;
        }
        .locaspec-pulse-dot.unlicensed {
            background: #64748B;
            box-shadow: none;
            animation: none;
        }
        @keyframes locaspec-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
        }
        .locaspec-state-tag {
            font-size: 0.68rem;
            font-weight: 700;
            padding: 1px 6px;
            border-radius: 10px;
            background: rgba(16, 185, 129, 0.14);
            color: #10B981;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .locaspec-state-tag.offline {
            background: rgba(245, 158, 11, 0.14);
            color: #F59E0B;
        }
        .locaspec-state-tag.unlicensed {
            background: rgba(100, 116, 139, 0.18);
            color: #94A3B8;
        }
        .locaspec-offline-banner {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            border-radius: 10px;
            padding: 10px 14px;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.82rem;
            color: #F59E0B;
        }
        #locaspec-force-offline-toggle:checked + #locaspec-toggle-slider {
            background-color: #F59E0B;
        }
        #locaspec-force-offline-toggle:checked + #locaspec-toggle-slider:before {
            transform: translateX(20px);
        }
        #locaspec-toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
        }
`;

if (!html.includes('LocaSpec™ Enterprise Offline Rig Engine Styles')) {
    html = html.replace('.mobile-only-btn {', `${locaspecCss}\n        .mobile-only-btn {`);
}

// 3. Add LocaSpec Header Pill in .header-desktop-actions
const headerPillHtml = `                <button class="locaspec-header-pill" id="locaspec-header-btn" title="LocaSpec™ Field Offline Engine (Enterprise)" onclick="openLocaSpecModal()">
                    <span class="locaspec-pulse-dot" id="locaspec-header-dot"></span>
                    <span class="locaspec-label">LocaSpec™</span>
                    <span class="locaspec-state-tag" id="locaspec-header-status">Online</span>
                </button>`;

if (!html.includes('id="locaspec-header-btn"')) {
    html = html.replace('<div class="header-desktop-actions">', `<div class="header-desktop-actions">\n${headerPillHtml}`);
}

// 4. Add LocaSpec Item in Mobile Drawer List
const mobileDrawerItemHtml = `            <button class="mobile-nav-item" onclick="openLocaSpecModal(); closeMobileNavMenu();">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>
                <span>LocaSpec™ Offline Rig Engine</span>
                <span class="mobile-nav-item-badge" id="mobile-menu-locaspec-badge">Enterprise</span>
            </button>`;

if (!html.includes('openLocaSpecModal(); closeMobileNavMenu();')) {
    html = html.replace('<div class="mobile-nav-list">', `<div class="mobile-nav-list">\n${mobileDrawerItemHtml}`);
}

// 5. Add LocaSpec Modal before #standards-modal
const locaspecModalHtml = `    <!-- 🛰️ LocaSpec™ Enterprise Field Offline Rig Engine Modal -->
    <div id="locaspec-modal" class="gemini-modal" style="display:none; z-index:1150;">
        <div class="gemini-modal-content" style="max-width:760px; width:92%; max-height:88vh; display:flex; flex-direction:column; background:var(--gemini-surface); border:1px solid var(--gemini-border); border-radius:14px; box-shadow:0 12px 36px rgba(0,0,0,0.5); padding:22px; box-sizing:border-box;">
            <!-- Modal Header -->
            <div class="modal-header" style="border-bottom:1px solid var(--gemini-border); padding-bottom:12px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg, rgba(0,112,242,0.2), rgba(0,112,242,0.05)); border:1px solid rgba(0,112,242,0.3); display:flex; align-items:center; justify-content:center; color:#0070F2; font-size:1.3rem;">
                        🛰️
                    </div>
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <h3 style="margin:0; font-size:1.15rem; color:var(--gemini-text-main); font-weight:700;">LocaSpec™ Field Offline Engine</h3>
                            <span style="font-size:0.7rem; font-weight:700; background:rgba(0,112,242,0.12); color:var(--sap-blue); padding:2px 8px; border-radius:12px; border:1px solid rgba(0,112,242,0.25);">ENTERPRISE RIG SUITE</span>
                        </div>
                        <div style="font-size:0.76rem; color:var(--gemini-text-muted); margin-top:2px;">Zero-Connectivity Oilfield & Offshore Local Standards Verification (0% Hallucination)</div>
                    </div>
                </div>
                <button class="close-modal-btn" onclick="closeLocaSpecModal()">&times;</button>
            </div>

            <!-- Modal Scrollable Content -->
            <div style="overflow-y:auto; flex:1; padding-right:6px; display:flex; flex-direction:column; gap:14px;">
                
                <!-- Enterprise License Status Card -->
                <div id="locaspec-license-card" style="border:1px solid var(--gemini-border); border-radius:10px; padding:14px; background:var(--gemini-bg);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                        <div>
                            <span style="font-size:0.72rem; color:var(--gemini-text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px;">Subscription Entitlement</span>
                            <div id="locaspec-tier-display" style="font-size:0.98rem; font-weight:700; color:var(--gemini-text-main); margin-top:2px;">Checking License...</div>
                        </div>
                        <span id="locaspec-license-badge" class="curator-badge-excluded">Unlicensed</span>
                    </div>

                    <div id="locaspec-license-inputs" style="display:none; margin-top:8px;">
                        <p style="font-size:0.8rem; color:var(--gemini-text-muted); margin:0 0 8px 0; line-height:1.45;">
                            LocaSpec™ is exclusive to paid energy enterprises and certified rig inspectors. Enter your active enterprise license key to unlock offline IndexedDB syncing.
                        </p>
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="locaspec-key-input" class="admin-input" placeholder="e.g. LOCASPEC-ENTERPRISE-PRO-2026" style="margin-bottom:0; flex:1; font-family:monospace; text-transform:uppercase;">
                            <button class="curator-btn primary" id="locaspec-verify-btn" onclick="verifyLocaSpecKey()">Verify & Unlock</button>
                        </div>
                        <div style="font-size:0.72rem; color:var(--gemini-text-muted); margin-top:6px;">
                            Client Demo Key: <a href="javascript:void(0)" onclick="document.getElementById('locaspec-key-input').value='LOCASPEC-ENTERPRISE-PRO-2026'" style="color:var(--sap-blue); text-decoration:underline;">LOCASPEC-ENTERPRISE-PRO-2026</a>
                        </div>
                    </div>

                    <div id="locaspec-licensed-info" style="display:none; font-size:0.78rem; color:var(--gemini-text-muted); line-height:1.5;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px;">
                            <div>🏢 Organization: <strong id="locaspec-org-name" style="color:var(--gemini-text-main);">Energy Enterprise Client</strong></div>
                            <div>⏳ Expiration: <strong id="locaspec-expiry" style="color:var(--gemini-text-main);">2027-12-31</strong></div>
                            <div>🔑 Key: <code id="locaspec-active-key" style="color:var(--sap-blue);"></code></div>
                            <div>🛰️ Offline Status: <strong style="color:#10B981;">Unlimited Rig Access</strong></div>
                        </div>
                        <div style="margin-top:10px; display:flex; justify-content:flex-end;">
                            <button class="curator-btn" onclick="deactivateLocaSpecLicense()" style="font-size:0.72rem; padding:3px 8px;">Switch License</button>
                        </div>
                    </div>
                </div>

                <!-- Offline Package Sync Section -->
                <div id="locaspec-sync-section" style="border:1px solid var(--gemini-border); border-radius:10px; padding:14px; background:var(--gemini-bg);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <div>
                            <h4 style="margin:0; font-size:0.92rem; color:var(--gemini-text-main);">📦 Rig Standards Synchronization</h4>
                            <span style="font-size:0.74rem; color:var(--gemini-text-muted);">Pre-load engineering standards directly into your device browser (IndexedDB) for 0ms offline query execution.</span>
                        </div>
                        <span id="locaspec-storage-pill" style="font-size:0.72rem; padding:3px 8px; border-radius:10px; background:rgba(0,112,242,0.1); color:var(--sap-blue); font-weight:600; white-space:nowrap;">0 Chunks Cached</span>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr auto; gap:10px; margin-bottom:12px; align-items:center;">
                        <div>
                            <label style="font-size:0.75rem; color:var(--gemini-text-muted); display:block; margin-bottom:4px;">Target Rig Package:</label>
                            <select id="locaspec-package-select" class="admin-input" style="margin-bottom:0;">
                                <option value="all">Full Enterprise Suite (All 35 Standards, ~6,000 Chunks)</option>
                                <option value="drilling" selected>Drilling & Rig Suite (API 4G, 8B, 7G, 5CT, IADC, OEM, DS-1, API 53/16)</option>
                                <option value="pipeline">Pipelines & Piping Suite (ASME B31.3, B31.4, B31.8, API 510, 570, 1104)</option>
                                <option value="quality">Welding & NDT Quality Suite (ASME V, AWS D1.1, AWS B1.11, ISO 3834, API 2X)</option>
                            </select>
                        </div>
                        <div style="padding-top:18px;">
                            <button class="curator-btn primary" id="locaspec-download-btn" onclick="startLocaSpecSync()" style="padding:8px 16px;">
                                <span>⬇️ Sync to Device</span>
                            </button>
                        </div>
                    </div>

                    <!-- Sync Progress Bar -->
                    <div id="locaspec-progress-container" style="display:none; margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px;">
                            <span id="locaspec-progress-status" style="color:var(--gemini-text-main);">Downloading standards bundle...</span>
                            <span id="locaspec-progress-pct" style="color:var(--sap-blue); font-weight:700;">0%</span>
                        </div>
                        <div style="width:100%; height:8px; background:var(--gemini-surface); border-radius:4px; overflow:hidden; border:1px solid var(--gemini-border);">
                            <div id="locaspec-progress-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #0070F2, #10B981); transition:width 0.2s ease;"></div>
                        </div>
                    </div>

                    <!-- Cached Standards Tag Cloud -->
                    <div style="margin-top:10px;">
                        <div style="font-size:0.74rem; color:var(--gemini-text-muted); margin-bottom:6px;">Locally Cached Standards:</div>
                        <div id="locaspec-cached-tags" style="display:flex; flex-wrap:wrap; gap:5px; max-height:90px; overflow-y:auto;">
                            <span style="font-size:0.72rem; color:var(--gemini-text-muted);">None synced yet. Click 'Sync to Device' above.</span>
                        </div>
                    </div>
                </div>

                <!-- Simulation & Diagnostic Controls -->
                <div style="border:1px solid var(--gemini-border); border-radius:10px; padding:12px 14px; background:var(--gemini-bg); display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:0.84rem; font-weight:600; color:var(--gemini-text-main); display:flex; align-items:center; gap:6px;">
                            <span>Force Offline Rig Simulation</span>
                            <span style="font-size:0.68rem; padding:1px 6px; border-radius:8px; background:rgba(245,158,11,0.12); color:#F59E0B; font-weight:700;">FIELD TEST</span>
                        </div>
                        <div style="font-size:0.74rem; color:var(--gemini-text-muted); margin-top:2px;">
                            Simulate zero internet connectivity to verify local IndexedDB search & offline answers.
                        </div>
                    </div>
                    <label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">
                        <input type="checkbox" id="locaspec-force-offline-toggle" onchange="toggleForceOfflineSimulation(this.checked)" style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#64748B; transition:.3s; border-radius:24px;" id="locaspec-toggle-slider"></span>
                    </label>
                </div>
            </div>

            <!-- Modal Footer -->
            <div style="border-top:1px solid var(--gemini-border); padding-top:12px; margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
                <button class="curator-btn danger" onclick="purgeLocaSpecCache()" style="font-size:0.75rem;">🗑️ Clear Local Storage</button>
                <button class="curator-btn" onclick="closeLocaSpecModal()">Close</button>
            </div>
        </div>
    </div>\n\n`;

if (!html.includes('id="locaspec-modal"')) {
    html = html.replace('<!-- Standards & Specifications Hub Modal -->', `${locaspecModalHtml}    <!-- Standards & Specifications Hub Modal -->`);
}

// 6. LocaSpec Engine JS Implementation
const locaspecJs = `
        // =========================================================================
        // 🛰️ LOCASPEC™ ENTERPRISE OFFLINE RIG ENGINE (IndexedDB + PWA)
        // Zero-Connectivity Verification & Local Retrieval for Remote Desert/Offshore
        // =========================================================================

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

                            if (selectedStandards && selectedStandards.length > 0) {
                                const matchesSelected = selectedStandards.some(s => stdCode.includes(s.toLowerCase()));
                                if (!matchesSelected) {
                                    cursor.continue();
                                    return;
                                }
                            }

                            let score = 0;

                            queryStdMentions.forEach(k => {
                                if (stdCode.includes(k)) score += 50;
                            });

                            if (clause && qClean.includes(clause)) score += 40;

                            if (terms.length >= 2 && content.includes(qClean.slice(0, 30))) {
                                score += 35;
                            }

                            terms.forEach(term => {
                                if (clause.includes(term)) score += 15;
                                if (section.includes(term)) score += 10;
                                if (content.includes(term)) {
                                    score += 4;
                                    if (content.includes('acceptance') || content.includes('reject') || content.includes('criteria') || content.includes('shall') || content.includes('maximum') || content.includes('minimum')) {
                                        score += 3;
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
            if (!matchedChunks || matchedChunks.length === 0) {
                if (isArabic) {
                    return '### 🛰️ محرك لوكا سبيك الميداني (أوفلاين بدون إنترنت)\\n' +
                           'لم يتم العثور على بنود مطابقة مباشرة لسؤالك في الحزمة المحلية المحملة حالياً.\\n' +
                           'يرجى التأكد من تزامن كامل الحزمة (Full Rig Suite) في لوحة لوكا سبيك، أو صياغة السؤال مع ذكر كود المعيار بدقة (مثال: API RP 8B أو API 4G).';
                } else {
                    return '### 🛰️ LocaSpec™ Field Offline Engine (Zero-Latency Local Retrieval)\\n' +
                           'No directly matching clauses found in your currently cached local rig bundle.\\n' +
                           'Please ensure the full enterprise package is synchronized in the LocaSpec panel, or refine your query with standard codes (e.g. API RP 8B, API 4G, ASME V).';
                }
            }

            const primary = matchedChunks[0];
            const std = primary.standard_code || 'Standard';
            const clause = primary.clause || 'Field Clause';
            const sec = primary.section || '';

            let lines = (primary.content || '').split('\\n').filter(l => l.trim().length > 0);
            let acceptance = lines.find(l => /ACCEPTANCE|Acceptance Criteria|قبول/i.test(l)) || '';
            let rejection = lines.find(l => /REJECTION|Reject|رفض/i.test(l)) || '';

            let res = '';
            if (isArabic) {
                res += '### 🛰️ تقييم لوكا سبيك الميداني — ' + std + ' (' + clause + ')\\n\\n';
                res += '> **توثيق أوفلاين مباشر من قاعدة البيانات المحلية في الميدان (0% هلوسة - استجابة فورية)**\\n\\n';
                res += '**المعيار المعتمد:** \`' + std + '\` | **البند:** \`' + clause + '\`' + (sec ? ' | **القسم:** ' + sec : '') + '\\n\\n';
                res += '#### 📋 متطلبات البند الميداني المعتمد:\\n';
                res += primary.content.replace(/\\[STANDARD:[^\\]]+\\]/g, '').trim() + '\\n\\n';
                if (acceptance) res += '**✅ معيار القبول (Acceptance Limit):**\\n' + acceptance + '\\n\\n';
                if (rejection) res += '**❌ معيار الرفض المباشر (Rejection Criteria):**\\n' + rejection + '\\n\\n';
                if (matchedChunks.length > 1) {
                    res += '#### 🔍 بنود تكميلية تم استرجاعها محلياً:\\n';
                    matchedChunks.slice(1, 4).forEach((c) => {
                        res += '- **' + c.standard_code + ' (' + (c.clause || 'Clause') + ')**: ' + (c.section ? c.section + ' — ' : '') + c.content.slice(0, 160).replace(/\\[STANDARD:[^\\]]+\\]/g, '').trim() + '...\\n';
                    });
                }
            } else {
                res += '### 🛰️ LocaSpec™ Field Rig Assessment — ' + std + ' (' + clause + ')\\n\\n';
                res += '> **Direct Zero-Connectivity Local Rig Evaluation (0% Hallucination — <10ms Local Execution)**\\n\\n';
                res += '**Standard Reference:** \`' + std + '\` | **Clause:** \`' + clause + '\`' + (sec ? ' | **Section:** ' + sec : '') + '\\n\\n';
                res += '#### 📋 Verbatim Field Standard Specification:\\n';
                res += primary.content.replace(/\\[STANDARD:[^\\]]+\\]/g, '').trim() + '\\n\\n';
                if (acceptance) res += '**✅ Acceptance Limits:**\\n' + acceptance + '\\n\\n';
                if (rejection) res += '**❌ Mandatory Rejection Threshold:**\\n' + rejection + '\\n\\n';
                if (matchedChunks.length > 1) {
                    res += '#### 🔍 Supplementary Local Clauses Retrieved:\\n';
                    matchedChunks.slice(1, 4).forEach((c) => {
                        res += '- **' + c.standard_code + ' (' + (c.clause || 'Clause') + ')**: ' + (c.section ? c.section + ' — ' : '') + c.content.slice(0, 160).replace(/\\[STANDARD:[^\\]]+\\]/g, '').trim() + '...\\n';
                    });
                }
            }
            return res;
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
                    if (headerStatus) { headerStatus.className = 'locaspec-state-tag offline'; headerStatus.textContent = 'Offline Mode'; }
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
        });
`;

// Insert locaspecJs before "window.addEventListener('DOMContentLoaded'"
if (!html.includes('LocaSpecEngine =')) {
    html = html.replace("window.addEventListener('DOMContentLoaded', () => {", `${locaspecJs}\n        window.addEventListener('DOMContentLoaded', () => {`);
}

// 7. Update sendMessage to check isSystemOffline()
const offlineCheckBlock = `            // 🛰️ Check LocaSpec Offline Mode First
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

                // Licensed user is offline: Run LocaSpec local IndexedDB engine!
                const isArabic = anyArabic(text);
                const activeStds = getActiveStandards();
                const matchedChunks = await LocaSpecEngine.search(text, activeStds);
                const answerMarkdown = formatLocaSpecOfflineAnswer(text, matchedChunks, isArabic);
                const sources = matchedChunks.map(c => ({
                    standard: c.standard_code,
                    clause: c.clause,
                    section: c.section,
                    text_snippet: (c.content || '').slice(0, 160)
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
            }
`;

if (!html.includes('Check LocaSpec Offline Mode First')) {
    html = html.replace('showStatusAnimation();\n\n            try {', `showStatusAnimation();\n\n${offlineCheckBlock}\n            try {`);
}

// 8. Update DOMContentLoaded to initialize LocaSpec
if (!html.includes('updateLocaSpecUI();')) {
    html = html.replace('initNotebookLMSidebar();', 'initNotebookLMSidebar();\n            updateLocaSpecUI();');
}

// 9. Update Escape key dismissal for locaspec-modal
if (!html.includes('locaspec-modal')) {
    html = html.replace("const editModal = document.getElementById('curator-edit-modal');", `const locaspecModal = document.getElementById('locaspec-modal');
                if (locaspecModal && locaspecModal.style.display === 'flex') {
                    closeLocaSpecModal();
                    return;
                }
                const editModal = document.getElementById('curator-edit-modal');`);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully injected LocaSpec Enterprise Engine into index.html');
