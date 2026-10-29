// scripts/patch_frontend_loop2_and_parameter_box.js
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

const normalize = s => s.replace(/\r\n/g, '\n');
content = normalize(content);

console.log('1. Checking CSS...');
const cssTarget = `.verdict-exec-val {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--gemini-text-main);
            line-height: 1.4;
        }`;

const cssReplacement = `.verdict-exec-val {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--gemini-text-main);
            line-height: 1.4;
        }

        /* 🛡️ QC 4-Point Field Parameter Box Card (Level III Ground Truth) */
        .qc-parameter-card {
            background: linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
            border: 1px solid rgba(234, 179, 8, 0.35);
            border-left: 4px solid #EAB308;
            border-radius: 8px;
            margin: 14px 0 16px 0;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        :root.light-mode .qc-parameter-card {
            background: #FFFFFF;
            border: 1px solid rgba(202, 138, 4, 0.4);
            border-left: 4px solid #CA8A04;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        body.rtl .qc-parameter-card {
            border-left: 1px solid rgba(234, 179, 8, 0.35);
            border-right: 4px solid #EAB308;
        }
        .qc-param-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 14px;
            background: rgba(234, 179, 8, 0.08);
            border-bottom: 1px solid rgba(234, 179, 8, 0.2);
        }
        .qc-param-title {
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.6px;
            color: #FACC15;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        :root.light-mode .qc-param-title {
            color: #A16207;
        }
        .qc-param-badge {
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #10B981;
            background: rgba(16, 185, 129, 0.12);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .qc-param-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1px;
            background: rgba(255, 255, 255, 0.06);
        }
        :root.light-mode .qc-param-grid {
            background: rgba(0, 0, 0, 0.06);
        }
        .qc-param-cell {
            background: var(--gemini-surface);
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .qc-param-label {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--gemini-text-muted);
        }
        .qc-param-val {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--gemini-text-main);
            line-height: 1.35;
        }

        /* 🔁 LOOP 2 FIELD QUALITY STAMP ACTION BAR */
        .loop2-stamp-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px dashed var(--gemini-border);
        }
        .stamp-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.72rem;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid var(--gemini-border);
            background: var(--gemini-surface);
            color: var(--gemini-text-muted);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .stamp-btn:hover {
            background: var(--gemini-surface-hover);
            color: var(--gemini-text-main);
            border-color: var(--gemini-blue);
        }
        .stamp-accept:hover {
            color: #10B981;
            border-color: #10B981;
            background: rgba(16, 185, 129, 0.08);
        }
        .stamp-reject:hover {
            color: #EF4444;
            border-color: #EF4444;
            background: rgba(239, 68, 68, 0.08);
        }
        .stamp-badge-recorded {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.72rem;
            font-weight: 700;
            color: #10B981;
            background: rgba(16, 185, 129, 0.1);
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid rgba(16, 185, 129, 0.25);
        }`;

if (!content.includes('.qc-parameter-card') && content.includes(normalize(cssTarget))) {
  content = content.replace(normalize(cssTarget), normalize(cssReplacement));
  console.log('✅ CSS added successfully.');
} else {
  console.log('ℹ️ CSS already present or target not matched.');
}

console.log('2. Checking formatParameterBox and helper functions...');
const funcTarget = `        function formatExecutiveVerdictCard(html) {`;

const funcAddition = `        function formatParameterBox(html) {
            const paramBoxRegex = /(?:<p>\s*<strong[^>]*>([\s\S]*?(?:Parameter Box|FIELD ACTION SUMMARY)[\s\S]*?)<\/strong>\s*<\/p>|<h[2-4][^>]*>([\s\S]*?(?:Parameter Box|FIELD ACTION SUMMARY)[\s\S]*?)<\/h[2-4]>)\s*<ul[^>]*>([\s\S]*?)<\/ul>/i;
            return html.replace(paramBoxRegex, (match, pTitle, hTitle, listItems) => {
                let title = stripDistractingEmojis(pTitle || hTitle || 'FIELD PARAMETER SCORECARD');
                const items = [];
                const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
                let m;
                while ((m = itemRegex.exec(listItems)) !== null) {
                    let itemContent = stripDistractingEmojis(m[1]);
                    let label = '';
                    let val = itemContent;
                    if (itemContent.includes('</strong>:')) {
                        const parts = itemContent.split('</strong>:');
                        label = parts[0].replace(/<strong[^>]*>/, '').trim();
                        val = parts.slice(1).join('</strong>:').trim();
                    } else if (itemContent.includes('<strong>')) {
                        const parts = itemContent.split('</strong>');
                        label = parts[0].replace(/<strong[^>]*>/, '').trim();
                        val = parts.slice(1).replace(/^[:\s-]+/, '').trim();
                    } else if (content.includes(':')) {
                        const parts = itemContent.split(':');
                        label = parts[0].trim();
                        val = parts.slice(1).join(':').trim();
                    }
                    items.push({ label, val });
                }

                let cellsHtml = '';
                items.forEach(it => {
                    cellsHtml += \`
                        <div class="qc-param-cell">
                            <span class="qc-param-label">\${it.label}</span>
                            <span class="qc-param-val">\${it.val}</span>
                        </div>
                    \`;
                });

                return \`
                    <div class="qc-parameter-card">
                        <div class="qc-param-header">
                            <div class="qc-param-title">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                <span>\${title.toUpperCase()}</span>
                            </div>
                            <span class="qc-param-badge">LEVEL III VERIFIED</span>
                        </div>
                        <div class="qc-param-grid">
                            \${cellsHtml}
                        </div>
                    </div>
                \`;
            });
        }

        async function submitLoop2Feedback(btn, decisionStatus, sessId) {
            btn.disabled = true;
            const originalHtml = btn.innerHTML;
            btn.innerHTML = 'Logging...';
            try {
                const res = await fetch(\`\${API_BASE}/api/feedback/loop\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessId || sessionId,
                        decision_status: decisionStatus,
                        inspector_id: 'LEVEL_III_FIELD',
                        inspector_cert: 'AWS-CWI / ASNT-LIII'
                    })
                });
                const d = await res.json();
                if (d.success) {
                    btn.parentElement.innerHTML = \`<span class="stamp-badge-recorded">✓ Level III Verified Stamp Recorded (D1 Ledger #\${d.record_id})</span>\`;
                } else {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                }
            } catch(e) {
                console.error(e);
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        }

        async function openDiscrepancyModal(btn, sessId) {
            const note = prompt("Please enter the specific code discrepancy or incorrect tolerance observed:");
            if (!note) return;
            btn.disabled = true;
            try {
                const res = await fetch(\`\${API_BASE}/api/feedback/loop\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: sessId || sessionId,
                        decision_status: 'REJECTED',
                        inspector_id: 'LEVEL_III_FIELD',
                        inspector_cert: 'AWS-CWI / ASNT-LIII',
                        discrepancy_field: 'CODE_NUMERICAL_TOLERANCE',
                        notes: note
                    })
                });
                const d = await res.json();
                if (d.success) {
                    btn.parentElement.innerHTML = \`<span class="stamp-badge-recorded" style="color:#EF4444; background:rgba(239, 68, 68, 0.1); border-color:rgba(239, 68, 68, 0.3);">⚠️ Discrepancy Logged for Level III Audit (Ledger #\${d.record_id})</span>\`;
                }
            } catch(e) {
                console.error(e);
                btn.disabled = false;
            }
        }

        function formatExecutiveVerdictCard(html) {`;

if (!content.includes('function formatParameterBox') && content.includes(normalize(funcTarget))) {
  content = content.replace(normalize(funcTarget), normalize(funcAddition));
  console.log('✅ Functions added successfully.');
} else {
  console.log('ℹ️ Functions already present.');
}

console.log('3. Updating appendMessage formatParameterBox call...');
const appendTarget = `                contentDiv.innerHTML = formatExecutiveVerdictCard(parsedHtml);`;
const appendReplacement = `                parsedHtml = formatExecutiveVerdictCard(parsedHtml);
                parsedHtml = formatParameterBox(parsedHtml);
                contentDiv.innerHTML = parsedHtml;`;

if (content.includes(normalize(appendTarget))) {
  content = content.replace(normalize(appendTarget), normalize(appendReplacement));
  console.log('✅ appendMessage formatParameterBox call added.');
}

console.log('4. Updating toolbar buttons...');
const toolbarTarget = `                    <button class="tool-btn" onclick="alert('Thank you for your feedback!')">👍</button>
                    <button class="tool-btn" onclick="alert('Feedback noted for engineering review.')">👎</button>`;

const toolbarReplacement = `                    <button class="tool-btn stamp-accept" onclick="submitLoop2Feedback(this, 'ACCEPTED', '\\\${sessionId}')" title="Stamp this response into D1 Field Quality Ledger">🛡️ Level III Verify</button>
                    <button class="tool-btn stamp-reject" onclick="openDiscrepancyModal(this, '\\\${sessionId}')" title="Flag a code discrepancy">⚠️ Flag Discrepancy</button>`;

if (content.includes(normalize(toolbarTarget))) {
  content = content.replace(normalize(toolbarTarget), normalize(toolbarReplacement));
  console.log('✅ Toolbar buttons wired to Loop 2 Feedback.');
}

// Convert back to CRLF on Windows
const crlfContent = content.replace(/\n/g, '\r\n');
fs.writeFileSync(htmlPath, crlfContent, 'utf8');
console.log('Patch completed successfully!');
