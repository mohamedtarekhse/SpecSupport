const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add CSS for export-pdf-btn and export-word-btn
const toolBtnCssAnchor = `.tool-btn:hover {
            background: var(--gemini-surface); color: var(--gemini-text-main);
            border-color: var(--gemini-border);
        }`;

const newToolBtnCss = `.tool-btn:hover {
            background: var(--gemini-surface); color: var(--gemini-text-main);
            border-color: var(--gemini-border);
        }
        .tool-btn.export-pdf-btn {
            background: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.28);
            color: #ef4444;
            font-weight: 500;
        }
        .tool-btn.export-pdf-btn:hover {
            background: rgba(239, 68, 68, 0.18);
            border-color: #ef4444;
            color: #ffffff;
        }
        .tool-btn.export-word-btn {
            background: rgba(37, 99, 235, 0.08);
            border: 1px solid rgba(37, 99, 235, 0.28);
            color: #3b82f6;
            font-weight: 500;
        }
        .tool-btn.export-word-btn:hover {
            background: rgba(37, 99, 235, 0.18);
            border-color: #3b82f6;
            color: #ffffff;
        }`;

if (!html.includes('.tool-btn.export-pdf-btn')) {
  html = html.replace(toolBtnCssAnchor, newToolBtnCss);
  console.log('Added CSS for export-pdf-btn and export-word-btn.');
}

// 2. Update response-toolbar HTML in appendMessage
const oldToolbarHtml = `                    <button class="tool-btn" onclick="copyAnswer(this, \\\`\${encodeURIComponent(cleanText)}\\\`)">📋 Copy</button>
                    <button class="tool-btn" onclick="alert('Thank you for your feedback!')">👍</button>
                    <button class="tool-btn" onclick="alert('Feedback noted for engineering review.')">👎</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 Export NCR</button>`;

const newToolbarHtml = `                    <button class="tool-btn" onclick="copyAnswer(this, \\\`\${encodeURIComponent(cleanText)}\\\`)">📋 Copy</button>
                    <button class="tool-btn export-pdf-btn" onclick="exportToPdf(\\\`\${encodeURIComponent(cleanText)}\\\`)">📄 Export PDF</button>
                    <button class="tool-btn export-word-btn" onclick="exportToWord(\\\`\${encodeURIComponent(cleanText)}\\\`)">📝 Export Word</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 NCR Form</button>
                    <button class="tool-btn" onclick="alert('Positive verification noted.')">👍</button>
                    <button class="tool-btn" onclick="alert('Feedback recorded for engineering audit.')">👎</button>`;

if (html.includes(oldToolbarHtml)) {
  html = html.replace(oldToolbarHtml, newToolbarHtml);
  console.log('Updated response-toolbar buttons.');
} else {
  console.log('Could not find exact oldToolbarHtml, searching with regex...');
  html = html.replace(/<button class="tool-btn" onclick="exportNCR\([\s\S]*?<\/button>/, 
    `<button class="tool-btn export-pdf-btn" onclick="exportToPdf(\\\`\${encodeURIComponent(cleanText)}\\\`)">📄 Export PDF</button>
                    <button class="tool-btn export-word-btn" onclick="exportToWord(\\\`\${encodeURIComponent(cleanText)}\\\`)">📝 Export Word</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 NCR Form</button>`
  );
}

// 3. Extract and fix the misplaced PWA modals and replace exportNCR with the full document suite
const pwaBannerHtml = `    <!-- 📲 PWA Bottom Floating Mobile Install Banner -->
    <div id="pwa-install-banner" style="display:none;">
        <div class="pwa-banner-content">
            <div class="pwa-banner-info">
                <img src="./icon-192.png" width="38" height="38" style="border-radius:9px; box-shadow:0 2px 8px var(--sap-blue-glow);" alt="SpecSupport Logo">
                <div>
                    <div style="font-size:0.86rem; font-weight:700; color:var(--gemini-text-main);">Install SpecSupport App</div>
                    <div style="font-size:0.72rem; color:var(--gemini-text-muted);">Android PWA • 0ms launch & offline rig access</div>
                </div>
            </div>
            <div class="pwa-banner-actions">
                <button class="curator-btn primary" onclick="triggerPwaInstall()" style="padding:6px 14px; font-size:0.78rem;">Install</button>
                <button onclick="dismissPwaBanner()" style="background:none; border:none; color:var(--gemini-text-muted); font-size:1.3rem; cursor:pointer; padding:0 4px; line-height:1;">&times;</button>
            </div>
        </div>
    </div>

    <!-- 📲 PWA Installation Guide Modal (Android Chrome / Safari / Samsung) -->
    <div id="pwa-guide-modal" class="gemini-modal" style="display:none; z-index:1250;">
        <div class="gemini-modal-content" style="max-width:540px; width:92%; padding:22px; box-sizing:border-box;">
            <div class="modal-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="./icon-192.png" width="34" height="34" style="border-radius:8px;" alt="Logo">
                    <h3 style="margin:0; font-size:1.05rem;">Install SpecSupport on Android / Mobile</h3>
                </div>
                <button class="close-modal-btn" onclick="closePwaGuideModal()">&times;</button>
            </div>
            <div style="font-size:0.82rem; color:var(--gemini-text-muted); margin-bottom:14px; line-height:1.5;">
                SpecSupport is a certified Progressive Web App (PWA). You can install it on your home screen for instantaneous launch and 100% offline rig operation.
            </div>

            <div style="background:var(--gemini-bg); border:1px solid var(--gemini-border); border-radius:10px; padding:14px; margin-bottom:12px;">
                <div style="font-weight:700; color:var(--gemini-text-main); font-size:0.86rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                    <span>🤖 Android Chrome Installation:</span>
                </div>
                <ol style="margin:0 0 0 18px; padding:0; font-size:0.8rem; color:var(--gemini-text-muted); line-height:1.6;">
                    <li>Tap the <strong>Chrome menu (⋮)</strong> in the top-right corner.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong> (تثبيت التطبيق / إضافة إلى الشاشة الرئيسية).</li>
                    <li>Confirm by clicking <strong>"Install"</strong>.</li>
                </ol>
            </div>

            <div style="background:var(--gemini-bg); border:1px solid var(--gemini-border); border-radius:10px; padding:14px; margin-bottom:14px;">
                <div style="font-weight:700; color:var(--gemini-text-main); font-size:0.86rem; margin-bottom:6px; display:flex; align-items:center; gap:8px;">
                    <span>⚡ Quick Android Shortcuts (Long-press icon):</span>
                </div>
                <ul style="margin:0 0 0 18px; padding:0; font-size:0.78rem; color:var(--gemini-text-muted); line-height:1.5;">
                    <li>🛰️ <strong>LocaSpec Rig</strong>: Jump straight to 0-byte offline engine</li>
                    <li>📁 <strong>Standards Hub</strong>: Direct access to 35 oil & gas standards</li>
                    <li>🔍 <strong>Defect Vision AI</strong>: Instant computer vision camera inspection</li>
                </ul>
            </div>

            <div style="display:flex; justify-content:flex-end;">
                <button class="curator-btn primary" onclick="closePwaGuideModal()">Got It!</button>
            </div>
        </div>
    </div>`;

// Check where exportNCR is and replace it with the complete Document Export Suite
const exportBlockAnchorStart = `        function exportNCR(encodedText) {`;
const exportBlockAnchorEnd = `        // =========================================================
        // 🎙️ RIG VOICE-TO-AUDIT ENGINE (Agent-Reach Whisper Pattern)
        // =========================================================`;

const startExpIdx = html.indexOf(exportBlockAnchorStart);
const endExpIdx = html.indexOf(exportBlockAnchorEnd);

if (startExpIdx !== -1 && endExpIdx !== -1) {
  const documentExportSuite = `        // =========================================================
        // 📄 EXECUTIVE DOCUMENT EXPORT SUITE (PDF, WORD & NCR)
        // =========================================================
        function prepareDocumentData(rawText) {
            const lower = rawText.toLowerCase();
            let docTitle = "OFFICIAL TECHNICAL SPECIFICATION & COMPLIANCE VERDICT";
            let docSub = "SpecSupport Enterprise AI Quality Engineering Certificate";

            if (lower.includes('wps') || lower.includes('welding procedure') || lower.includes('qw-482')) {
                docTitle = "WELDING PROCEDURE SPECIFICATION (WPS)";
                docSub = "ASME Section IX Form QW-482 / ASME B31.3 Qualified Procedure";
            } else if (lower.includes('ndt') || lower.includes('ultrasonic') || lower.includes('radiographic') || lower.includes('magnetic particle')) {
                docTitle = "NON-DESTRUCTIVE EXAMINATION (NDE) SPECIFICATION & RECORD";
                docSub = "ASME Boiler & Pressure Vessel Code Section V Written Procedure";
            } else if (lower.includes('hydrotest') || lower.includes('hydrostatic') || lower.includes('pressure test')) {
                docTitle = "HYDROSTATIC PRESSURE TEST PROCEDURE & CERTIFICATE";
                docSub = "ASME B31.3 / B31.4 / B31.8 Pressure Integrity Verification";
            } else if (lower.includes('bop') || lower.includes('well control') || lower.includes('api 53')) {
                docTitle = "WELL CONTROL & BOP PRESSURE TEST PROTOCOL";
                docSub = "API Standard 53 Surface / Subsea Operational Verification";
            } else if (lower.includes('api 510') || lower.includes('api 570') || lower.includes('remaining life') || lower.includes('tmin')) {
                docTitle = "FITNESS-FOR-SERVICE & WALL THICKNESS EVALUATION";
                docSub = "API 510 / 570 / 579 Engineering Verification Record";
            } else if (lower.includes('api rp 8b') || lower.includes('elevator') || lower.includes('hoisting')) {
                docTitle = "DRILLING & HOISTING EQUIPMENT INSPECTION CERTIFICATE";
                docSub = "API RP 8B / API Spec 8C Category III/IV Verification";
            } else if (lower.includes('api rp 7g-2') || lower.includes('drill stem') || lower.includes('ds-1')) {
                docTitle = "DRILL STEM & TUBULAR CLASSIFICATION REPORT";
                docSub = "API RP 7G-2 / TH Hill DS-1 Inspection & Discard Assessment";
            }

            const reportNo = "SSR-" + new Date().getFullYear() + "-" + Math.floor(100000 + Math.random() * 900000);
            const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            // Render markdown to HTML
            let renderedHtml = marked.parse(rawText);
            // Remove any leftover HTML comment blocks
            renderedHtml = renderedHtml.replace(/<!--[\\s\\S]*?-->/g, '');

            return { docTitle, docSub, reportNo, dateStr, renderedHtml };
        }

        function exportToWord(encodedText) {
            const raw = decodeURIComponent(encodedText);
            const { docTitle, docSub, reportNo, dateStr, renderedHtml } = prepareDocumentData(raw);

            const wordContent = \`
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset="utf-8">
    <title>\${docTitle}</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page Section1 {
            size: 8.27in 11.69in;
            margin: 0.8in 0.8in 0.8in 0.8in;
            mso-header-margin: 0.4in;
            mso-footer-margin: 0.4in;
            mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
            font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
            font-size: 11pt;
            color: #1e293b;
            line-height: 1.45;
        }
        .header-tbl {
            width: 100%;
            border-collapse: collapse;
            border: 2pt solid #0f172a;
            margin-bottom: 16pt;
        }
        .header-tbl td {
            padding: 8pt 10pt;
            border: 1pt solid #cbd5e1;
        }
        .doc-title {
            font-size: 15pt;
            font-weight: bold;
            color: #0f172a;
            margin: 0;
            text-transform: uppercase;
        }
        .doc-sub {
            font-size: 9.5pt;
            color: #475569;
            margin: 2pt 0 0 0;
        }
        h1, h2, h3, h4 {
            color: #0f172a;
            font-weight: bold;
            margin-top: 14pt;
            margin-bottom: 6pt;
        }
        h2 {
            font-size: 12.5pt;
            border-bottom: 1.5pt solid #0f172a;
            padding-bottom: 3pt;
        }
        h3 { font-size: 11pt; color: #1e3a8a; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10pt 0;
        }
        th {
            background-color: #0f172a;
            color: #ffffff;
            border: 1pt solid #0f172a;
            padding: 6pt 8pt;
            font-size: 9.5pt;
            font-weight: bold;
            text-align: left;
        }
        td {
            border: 1pt solid #cbd5e1;
            padding: 5pt 8pt;
            font-size: 9.5pt;
        }
        tr:nth-child(even) td { background-color: #f8fafc; }
        pre, code {
            font-family: 'Consolas', 'Courier New', monospace;
            background-color: #f1f5f9;
            font-size: 9pt;
        }
        pre {
            padding: 8pt;
            border: 1pt solid #cbd5e1;
            border-radius: 4pt;
        }
        .signoff-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5pt solid #0f172a;
            margin-top: 20pt;
        }
        .signoff-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            border: 1pt solid #cbd5e1;
            padding: 6pt 8pt;
            font-size: 9pt;
            text-align: left;
        }
        .signoff-table td {
            border: 1pt solid #cbd5e1;
            padding: 8pt;
            font-size: 9pt;
            height: 60pt;
            vertical-align: top;
        }
        .doc-footer {
            margin-top: 24pt;
            padding-top: 6pt;
            border-top: 1pt solid #e2e8f0;
            font-size: 8pt;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="Section1">
        <table class="header-tbl">
            <tr>
                <td style="width:70%; background-color:#ffffff;">
                    <div style="font-size:8.5pt; font-weight:bold; color:#0284c7; letter-spacing:1px; margin-bottom:3pt;">SPECSUPPORT • ASSET INTEGRITY & QUALITY ASSURANCE</div>
                    <div class="doc-title">\${docTitle}</div>
                    <div class="doc-sub">\${docSub}</div>
                </td>
                <td style="width:30%; background-color:#f8fafc; font-size:9pt; line-height:1.4;">
                    <strong>Report Ref:</strong> \${reportNo}<br>
                    <strong>Date:</strong> \${dateStr}<br>
                    <strong>Status:</strong> <span style="color:#059669; font-weight:bold;">VERIFIED COMPLIANT</span><br>
                    <strong>System:</strong> SpecSupport AI
                </td>
            </tr>
        </table>

        <div class="doc-body">
            \${renderedHtml}
        </div>

        <div style="margin-top:20pt; page-break-inside:avoid;">
            <div style="font-size:10pt; font-weight:bold; color:#0f172a; text-transform:uppercase; margin-bottom:4pt;">Quality Verification & Authorization Block</div>
            <table class="signoff-table">
                <tr>
                    <th style="width:33.3%;">Prepared / Examined By</th>
                    <th style="width:33.3%;">Reviewed By (QA/QC Coordinator)</th>
                    <th style="width:33.3%;">Witness / Acceptance (Client / AI)</th>
                </tr>
                <tr>
                    <td>
                        <strong>Name:</strong> ________________________<br>
                        <strong>Qualification:</strong> CSWIP 3.1 / ASNT Level II<br>
                        <strong>Signature:</strong> _____________________<br>
                        <strong>Date:</strong> \${dateStr}
                    </td>
                    <td>
                        <strong>Name:</strong> ________________________<br>
                        <strong>Title:</strong> QA/QC Manager / IWE<br>
                        <strong>Stamp / Signature:</strong><br><br>
                        <strong>Date:</strong> ________________________
                    </td>
                    <td>
                        <strong>Name:</strong> ________________________<br>
                        <strong>Company:</strong> Operator / Authorized Agency<br>
                        <strong>Disposition:</strong> [✓] ACCEPTED  [ ] REJECTED<br>
                        <strong>Signature:</strong> _____________________
                    </td>
                </tr>
            </table>
        </div>

        <div class="doc-footer">
            <span>Generated via SpecSupport Enterprise AI • Certified Engineering Reference</span>
            <span>Document Ref: \${reportNo} • Page 1 of 1</span>
        </div>
    </div>
</body>
</html>\`;

            const blob = new Blob(['\\ufeff' + wordContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`\${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}_\${reportNo}.doc\`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function exportToPdf(encodedText) {
            const raw = decodeURIComponent(encodedText);
            const { docTitle, docSub, reportNo, dateStr, renderedHtml } = prepareDocumentData(raw);

            const printWin = window.open('', '_blank');
            if (!printWin) {
                alert('Please allow popups in your browser to view the printable PDF report.');
                return;
            }

            printWin.document.write(\`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>\${docTitle} - \${reportNo}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 16mm 15mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
            font-size: 9.5pt;
            color: #0f172a;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            background: #ffffff;
        }
        .no-print-bar {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .print-btn {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.9rem;
        }
        .print-btn:hover { background: #1d4ed8; }
        .doc-container {
            max-width: 900px;
            margin: 0 auto;
        }
        .doc-header-card {
            display: flex;
            justify-content: space-between;
            border: 2px solid #0f172a;
            border-radius: 6px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        .doc-header-main {
            padding: 14px 18px;
            flex: 1;
        }
        .org-badge {
            font-size: 7.5pt;
            font-weight: 700;
            color: #0284c7;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .doc-title {
            font-size: 13.5pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
            line-height: 1.25;
            text-transform: uppercase;
        }
        .doc-sub {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 3px;
        }
        .doc-header-meta {
            width: 250px;
            background: #f8fafc;
            border-left: 1px solid #cbd5e1;
            padding: 12px 16px;
            font-size: 8.5pt;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
        }
        .meta-item { display: flex; justify-content: space-between; }
        .meta-label { color: #64748b; font-weight: 500; }
        .meta-val { font-weight: 600; color: #0f172a; }
        
        h1, h2, h3, h4 { color: #0f172a; margin-top: 16px; margin-bottom: 6px; }
        h2 { font-size: 11.5pt; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; }
        h3 { font-size: 10.5pt; color: #1e3a8a; }
        p, li { color: #334155; font-size: 9pt; line-height: 1.5; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            page-break-inside: avoid;
        }
        th {
            background-color: #0f172a;
            color: #ffffff;
            border: 1px solid #0f172a;
            padding: 6px 9px;
            font-size: 8pt;
            font-weight: 600;
            text-align: left;
        }
        td {
            border: 1px solid #cbd5e1;
            padding: 5px 9px;
            font-size: 8pt;
            color: #1e293b;
        }
        tr:nth-child(even) td { background-color: #f8fafc; }
        pre {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 8pt;
            overflow-x: auto;
        }
        .signoff-card {
            margin-top: 26px;
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .signoff-title {
            background: #f1f5f9;
            padding: 7px 12px;
            font-size: 8.5pt;
            font-weight: 700;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
        }
        .signoff-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
        }
        .signoff-col {
            padding: 10px 12px;
            border-right: 1px solid #cbd5e1;
            font-size: 8pt;
            min-height: 85px;
        }
        .signoff-col:last-child { border-right: none; }
        .doc-footer {
            margin-top: 22px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 7.5pt;
            color: #94a3b8;
        }
        @media print {
            .no-print-bar { display: none !important; }
            body { padding: 0; }
            table { page-break-inside: avoid; }
            .signoff-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="doc-container">
        <div class="no-print-bar">
            <div><strong>Inspection Certificate Preview</strong> • Print or Save to PDF</div>
            <div>
                <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
            </div>
        </div>

        <div class="doc-header-card">
            <div class="doc-header-main">
                <div class="org-badge">SpecSupport • Asset Integrity & Quality Assurance</div>
                <h1 class="doc-title">\${docTitle}</h1>
                <div class="doc-sub">\${docSub}</div>
            </div>
            <div class="doc-header-meta">
                <div class="meta-item"><span class="meta-label">Report Ref:</span> <span class="meta-val">\${reportNo}</span></div>
                <div class="meta-item"><span class="meta-label">Date:</span> <span class="meta-val">\${dateStr}</span></div>
                <div class="meta-item"><span class="meta-label">Compliance:</span> <span class="meta-val" style="color:#059669;">VERIFIED PASS</span></div>
                <div class="meta-item"><span class="meta-label">Engine:</span> <span class="meta-val">SpecSupport AI</span></div>
            </div>
        </div>

        <div class="doc-content">
            \${renderedHtml}
        </div>

        <div class="signoff-card">
            <div class="signoff-title">Quality Verification & Authorization Block</div>
            <div class="signoff-grid">
                <div class="signoff-col">
                    <strong>Prepared / Examined By:</strong><br><br>
                    Name: ________________________<br>
                    Qual: CSWIP 3.1 / ASNT Level II<br>
                    Sign: ________________________<br>
                    Date: \${dateStr}
                </div>
                <div class="signoff-col">
                    <strong>Reviewed By (QA/QC):</strong><br><br>
                    Name: ________________________<br>
                    Title: QA/QC Manager / IWE<br>
                    Stamp: _______________________<br>
                    Date: ________________________
                </div>
                <div class="signoff-col">
                    <strong>Witness / Client AI:</strong><br><br>
                    Name: ________________________<br>
                    Organization: Client / AI Agency<br>
                    Disposition: [✓] ACCEPTED  [ ] REJECTED<br>
                    Sign: ________________________
                </div>
            </div>
        </div>

        <div class="doc-footer">
            <span>Generated via SpecSupport Enterprise AI • Certified Engineering Reference</span>
            <span>Document Ref: \${reportNo} • Page 1 of 1</span>
        </div>
    </div>
    <script>
        window.onload = () => {
            setTimeout(() => { window.print(); }, 400);
        };
    </script>
</body>
</html>\`);
            printWin.document.close();
        }

        function exportNCR(encodedText) {
            const raw = decodeURIComponent(encodedText);
            const { reportNo, dateStr, renderedHtml } = prepareDocumentData(raw);

            const ncrWindow = window.open('', '_blank');
            if (!ncrWindow) {
                alert('Please allow popups to view the Non-Conformance Report.');
                return;
            }

            ncrWindow.document.write(\`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>NCR Report - \${reportNo}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; padding: 30px; color: #0f172a; max-width: 900px; margin: 0 auto; }
        .ncr-header { border: 2px solid #b91c1c; border-radius: 6px; padding: 15px; margin-bottom: 20px; background: #fef2f2; }
        .ncr-title { color: #b91c1c; margin: 0; font-size: 16pt; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 9pt; }
        th { background: #0f172a; color: #fff; }
        .btn-print { background: #b91c1c; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="ncr-header">
        <h2 class="ncr-title">NON-CONFORMANCE REPORT (NCR) - QUALITY DEPARTMENT</h2>
        <div style="font-size:9pt; color:#450a0a; margin-top:4px;">
            <strong>NCR Number:</strong> NCR-\${reportNo} | <strong>Issue Date:</strong> \${dateStr} | <strong>Severity:</strong> LEVEL 1 NON-CONFORMANCE
        </div>
    </div>
    <div class="ncr-content">
        \${renderedHtml}
    </div>
    <br>
    <button class="btn-print" onclick="window.print()">🖨️ Print NCR Document</button>
</body>
</html>\`);
            ncrWindow.document.close();
        }
`;

  html = html.substring(0, startExpIdx) + documentExportSuite + html.substring(endExpIdx);
  console.log('Successfully replaced exportNCR with Executive Document Export Suite!');
}

// 4. Place the PWA modals right before </body> if not present in the HTML body
if (!html.includes('<div id="pwa-install-banner"')) {
  const bodyCloseAnchor = '</body>';
  html = html.replace(bodyCloseAnchor, pwaBannerHtml + '\n</body>');
  console.log('Placed PWA banners properly right before closing </body> tag.');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Saved index.html successfully with PDF and Word forms export!');
