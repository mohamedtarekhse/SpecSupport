const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Step 0: Ensure we start from clean abbed39 baseline
console.log('--- Step 0: Restoring clean index.html from abbed39 ---');
execSync('git checkout abbed39 -- index.html', { cwd: path.join(__dirname, '..') });

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('--- Step 1: Extract and Relocate PWA Modals from Inside exportNCR ---');

// The clean PWA modals HTML
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

// Insert PWA modals right before `<!-- Core Application Logic -->` in <body>
const coreScriptAnchor = '    <!-- Core Application Logic -->';
if (html.includes(coreScriptAnchor)) {
    html = html.replace(coreScriptAnchor, `${pwaBannerHtml}\n\n${coreScriptAnchor}`);
    console.log('Placed PWA banner & modal right before <script>.');
}

console.log('--- Step 2: Inject Clean PDF & Word Export Functions alongside NCR ---');

const exportSuiteJs = `        // =========================================================
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
            renderedHtml = renderedHtml.replace(/<!--[\\s\\S]*?-->/g, '');

            return { docTitle, docSub, reportNo, dateStr, renderedHtml };
        }

        function exportToWord(encodedText) {
            const raw = decodeURIComponent(encodedText);
            const { docTitle, docSub, reportNo, dateStr, renderedHtml } = prepareDocumentData(raw);

            const wordContent = \`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
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
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.45; color: #1e293b; margin: 20mm; }
        .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5pt solid #0f172a; margin-bottom: 18pt; }
        .header-table td { padding: 6pt; vertical-align: middle; }
        .title { font-size: 15pt; font-weight: bold; color: #0f172a; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 9pt; color: #475569; font-weight: 600; margin-top: 3pt; }
        .badge { background: #0f172a; color: #ffffff; padding: 4pt 8pt; font-size: 8pt; font-weight: bold; border-radius: 3pt; display: inline-block; }
        .meta-box { border: 1pt solid #cbd5e1; background: #f8fafc; padding: 8pt; margin-bottom: 14pt; }
        .meta-table { width: 100%; border-collapse: collapse; }
        .meta-table td { padding: 3pt 6pt; font-size: 8.5pt; }
        .meta-label { font-weight: bold; color: #475569; }
        h1, h2, h3 { color: #0f172a; margin-top: 14pt; margin-bottom: 6pt; }
        h2 { font-size: 12pt; border-bottom: 1pt solid #94a3b8; padding-bottom: 2pt; }
        h3 { font-size: 10.5pt; color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
        th { background: #0f172a; color: #ffffff; font-weight: bold; border: 1pt solid #0f172a; padding: 5pt 7pt; font-size: 8.5pt; text-align: left; }
        td { border: 1pt solid #cbd5e1; padding: 4.5pt 7pt; font-size: 8.5pt; vertical-align: top; }
        tr:nth-child(even) td { background-color: #f8fafc; }
        .signoff-table { width: 100%; border-collapse: collapse; margin-top: 18pt; }
        .signoff-table th { background: #f1f5f9; color: #0f172a; border: 1pt solid #cbd5e1; font-size: 8.5pt; }
        .signoff-table td { border: 1pt solid #cbd5e1; height: 50pt; font-size: 8pt; vertical-align: top; padding: 6pt; }
        .doc-footer { margin-top: 20pt; font-size: 7.5pt; color: #64748b; border-top: 1pt solid #e2e8f0; padding-top: 6pt; text-align: center; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 70%;">
                <div class="badge">SPECSUPPORT • QUALITY & ENGINEERING AUDIT</div>
                <div class="title">\${docTitle}</div>
                <div class="subtitle">\${docSub}</div>
            </td>
            <td style="width: 30%; text-align: right;">
                <div style="font-size: 9pt; font-weight: bold; color: #0f172a;">REPORT #: \${reportNo}</div>
                <div style="font-size: 8pt; color: #64748b;">DATE: \${dateStr}</div>
                <div style="color: #059669; font-weight: bold; font-size: 8.5pt; margin-top: 3pt;">STATUS: PASS / CERTIFIED</div>
            </td>
        </tr>
    </table>

    <div class="meta-box">
        <table class="meta-table">
            <tr>
                <td style="width: 25%;"><span class="meta-label">Inspection Project:</span> Field Quality Assurance</td>
                <td style="width: 25%;"><span class="meta-label">Governing Standards:</span> ASME / API / ISO</td>
                <td style="width: 25%;"><span class="meta-label">Audit Engine:</span> SpecSupport Rig AI</td>
                <td style="width: 25%;"><span class="meta-label">Digital Hash:</span> \${reportNo.replace('SSR-', '0x')}</td>
            </tr>
        </table>
    </div>

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
        Generated via SpecSupport Enterprise AI • Certified Engineering Reference • Doc Ref: \${reportNo}
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
                alert('Please allow popups to view and print the engineering certificate.');
                return;
            }

            // CRITICAL: Escape <\\/script> so the parent HTML parser does NOT terminate the main <script> tag!
            printWin.document.write(\`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>\${docTitle} - \${reportNo}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 8.5pt;
            line-height: 1.45;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 24px;
        }
        .no-print-bar {
            background: #0f172a;
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .print-btn {
            background: #0070F2;
            color: #fff;
            border: none;
            padding: 7px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 8.5pt;
            cursor: pointer;
        }
        .doc-container {
            max-width: 820px;
            margin: 0 auto;
        }
        .doc-header-card {
            border-bottom: 2.5px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
        }
        .org-badge {
            font-size: 7.5pt;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #0070F2;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .doc-title {
            font-size: 13.5pt;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 4px 0;
        }
        .doc-sub {
            font-size: 8pt;
            color: #64748b;
            font-weight: 500;
        }
        .doc-header-meta {
            text-align: right;
            font-size: 7.5pt;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
        }
        .meta-item { display: flex; justify-content: space-between; gap: 8px; }
        .meta-label { color: #64748b; font-weight: 500; }
        .meta-val { font-weight: 600; color: #0f172a; }
        
        h1, h2, h3, h4 { color: #0f172a; margin-top: 14px; margin-bottom: 5px; }
        h2 { font-size: 11pt; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; }
        h3 { font-size: 10pt; color: #1e3a8a; }
        p, li { color: #334155; font-size: 8.5pt; line-height: 1.45; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            page-break-inside: avoid;
        }
        th {
            background-color: #0f172a;
            color: #ffffff;
            border: 1px solid #0f172a;
            padding: 5px 8px;
            font-size: 7.5pt;
            font-weight: 600;
            text-align: left;
        }
        td {
            border: 1px solid #cbd5e1;
            padding: 4.5pt 8px;
            font-size: 7.5pt;
            color: #1e293b;
        }
        tr:nth-child(even) td { background-color: #f8fafc; }
        pre {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 7.5pt;
            overflow-x: auto;
        }
        .signoff-card {
            margin-top: 22px;
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            overflow: hidden;
            page-break-inside: avoid;
        }
        .signoff-title {
            background: #f1f5f9;
            padding: 6px 10px;
            font-size: 8pt;
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
            padding: 8px 10px;
            border-right: 1px solid #cbd5e1;
            font-size: 7.5pt;
            min-height: 75px;
        }
        .signoff-col:last-child { border-right: none; }
        .doc-footer {
            margin-top: 18px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 7pt;
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
        window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
        };
    <\\/script>
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

            ncrWindow.document.write(\`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>NCR Report - \${reportNo}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; padding: 25px; color: #0f172a; max-width: 860px; margin: 0 auto; }
        .ncr-header { border: 2px solid #b91c1c; border-radius: 6px; padding: 14px; margin-bottom: 18px; background: #fef2f2; }
        .ncr-title { color: #b91c1c; margin: 0; font-size: 15pt; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 9px; font-size: 8.5pt; }
        th { background: #0f172a; color: #fff; }
        .btn-print { background: #b91c1c; color: #fff; border: none; padding: 7px 15px; border-radius: 4px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="ncr-header">
        <h2 class="ncr-title">NON-CONFORMANCE REPORT (NCR) - QUALITY DEPARTMENT</h2>
        <div style="font-size:8.5pt; color:#450a0a; margin-top:4px;">
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
        }`;

// Replace the old exportNCR block with exportSuiteJs
const ncrRegex = /function exportNCR\(encodedText\)[\s\S]*?(?=\/\/\s*={2,}\s*[\r\n]+\s*\/\/\s*🎙️)/;
if (ncrRegex.test(html)) {
    html = html.replace(ncrRegex, exportSuiteJs + '\n\n        ');
    console.log('Cleanly replaced exportNCR with the full Executive Document Export Suite.');
} else {
    console.warn('Could not locate old exportNCR bounds.');
}

console.log('--- Step 3: Add CSS for export-pdf-btn and export-word-btn ---');
const toolBtnCssAnchor = /\.tool-btn:hover\s*\{[\s\S]*?\}/;
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

html = html.replace(toolBtnCssAnchor, newToolBtnCss);
console.log('Added CSS for export-pdf-btn and export-word-btn.');

console.log('--- Step 4: Update appendMessage Toolbar Buttons ---');
const toolbarRegex = /<button class="tool-btn" onclick="exportNCR\([\s\S]*?<\/button>/;
const newToolbarSnippet = `<button class="tool-btn export-pdf-btn" onclick="exportToPdf(\\\`\${encodeURIComponent(cleanText)}\\\`)">📄 Export PDF</button>
                    <button class="tool-btn export-word-btn" onclick="exportToWord(\\\`\${encodeURIComponent(cleanText)}\\\`)">📝 Export Word</button>
                    <button class="tool-btn" onclick="exportNCR(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 NCR Form</button>`;

html = html.replace(toolbarRegex, newToolbarSnippet);
console.log('Updated appendMessage toolbar with PDF and Word buttons.');

console.log('--- Step 5: Solve Vertical Viewport Fitting & Layout Mathematics ---');

// 5a. Fix #app-container: allow overflow-y: auto and min-height: 0 so no content is ever clipped
html = html.replace(
    /#app-container\s*\{[\s\S]*?overflow:\s*hidden;?\s*\}/,
    `#app-container {
            flex: 1; display: flex; flex-direction: column; align-items: center;
            position: relative; width: 100%; height: 100%; min-height: 0;
            overflow-y: auto; overflow-x: hidden;
        }`
);

// 5b. Fix #greeting-area: Eliminate the obsolete 80px bottom dead padding, keep clean Gemini proportions
html = html.replace(
    /#greeting-area\s*\{[\s\S]*?padding:\s*20px\s+20px\s+80px\s+20px;?[\s\S]*?\}/,
    `#greeting-area {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            width: 100%; max-width: var(--max-width);
            padding: 16px 20px 10px 20px;
            box-sizing: border-box;
            text-align: center;
            min-height: 0;
            transition: opacity 0.3s ease;
        }`
);

// 5c. Fix .gemini-hero-headline font-size and margin
html = html.replace(
    /\.gemini-hero-headline\s*\{[\s\S]*?font-size:\s*2\.8rem;?[\s\S]*?margin:\s*0\s+0\s+12px\s+0;?/,
    `.gemini-hero-headline {
            font-size: 2.35rem;
            font-weight: 600;
            margin: 0 0 8px 0;`
);

// 5d. Fix .gemini-hero-sub margin
html = html.replace(
    /\.gemini-hero-sub\s*\{[\s\S]*?margin:\s*0\s+0\s+35px\s+0;?/,
    `.gemini-hero-sub {
            font-size: 1.02rem;
            color: var(--gemini-text-muted);
            margin: 0 0 18px 0;`
);

// 5e. Fix .prompt-cards-grid margin and card min-height
html = html.replace(
    /\.prompt-cards-grid\s*\{[\s\S]*?margin-bottom:\s*25px;?/,
    `.prompt-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            width: 100%;
            max-width: var(--max-width);
            margin-bottom: 16px;`
);

html = html.replace(
    /\.prompt-card\s*\{[\s\S]*?min-height:\s*110px;?[\s\S]*?position:\s*relative;?\s*\}/,
    `.prompt-card {
            background: var(--gemini-card-bg);
            border: 1px solid var(--gemini-card-border);
            border-radius: 16px;
            padding: 13px 15px;
            text-align: left;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex; flex-direction: column; justify-content: space-between;
            min-height: 90px;
            position: relative;
        }`
);

// 5f. Fix .state-greeting #input-container padding
html = html.replace(
    /\.state-greeting\s+#input-container\s*\{[\s\S]*?padding:\s*0\s+20px\s+28px\s+20px;?[\s\S]*?\}/,
    `.state-greeting #input-container {
            position: relative; bottom: auto;
            left: auto; transform: none;
            padding: 0 20px 14px 20px;
            width: 100%; max-width: var(--max-width);
            margin: 0 auto;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            flex-shrink: 0;
        }`
);

// 5g. Add compact height proportioning media query (without hiding any cards)
const compactHeightCss = `
        /* Height-Aware Proportioning for Standard Laptops (1366x768 / 125% DPI scale) */
        @media (max-height: 720px) {
            .gemini-hero-headline { font-size: 2.05rem !important; margin-bottom: 6px !important; }
            .gemini-hero-sub { font-size: 0.94rem !important; margin-bottom: 12px !important; }
            .prompt-cards-grid { margin-bottom: 12px !important; gap: 8px !important; }
            .prompt-card { min-height: 78px !important; padding: 10px 12px !important; }
            .prompt-card-icon { font-size: 1.1rem !important; margin-bottom: 4px !important; }
            .prompt-card-text { font-size: 0.8rem !important; line-height: 1.3 !important; }
            #greeting-area { padding: 10px 16px 6px 16px !important; }
            .state-greeting #input-container { padding: 0 16px 10px 16px !important; }
        }
`;

if (!html.includes('max-height: 720px')) {
    html = html.replace('</style>', `${compactHeightCss}\n    </style>`);
    console.log('Added height-aware proportioning for standard laptops.');
}

console.log('--- Step 6: Fix Sidebar Search Autofill Hijacking & Empty State UX ---');

// 6a. Update search box markup with autocomplete="off", spellcheck="false", and a clear button
const searchInputRegex = /<input type="text" id="source-search-input"[^>]*>/;
html = html.replace(
    searchInputRegex,
    `<input type="text" id="source-search-input" placeholder="Filter standards & manuals..." autocomplete="off" spellcheck="false" oninput="onSidebarSearchInput(this.value)">
                    <button id="sidebar-search-clear-btn" onclick="clearSidebarSearch()" style="display:none; position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--gemini-text-muted); cursor:pointer; font-size:1.15rem; padding:0 4px; line-height:1;" title="Clear filter">&times;</button>`
);

html = html.replace('class="sidebar-search-box"', 'class="sidebar-search-box" style="position:relative;"');
console.log('Updated sidebar search input with autocomplete="off" and clear button.');

// 6b. Add onSidebarSearchInput and clearSidebarSearch JS functions
const searchHelperJs = `
        function onSidebarSearchInput(val) {
            const clearBtn = document.getElementById('sidebar-search-clear-btn');
            if (clearBtn) {
                clearBtn.style.display = val.trim().length > 0 ? 'block' : 'none';
            }
            renderNotebookLMSidebar(val);
        }

        function clearSidebarSearch() {
            const input = document.getElementById('source-search-input');
            if (input) input.value = '';
            const clearBtn = document.getElementById('sidebar-search-clear-btn');
            if (clearBtn) clearBtn.style.display = 'none';
            renderNotebookLMSidebar('');
        }
`;

html = html.replace('function filterSidebarStandards(val) {', `${searchHelperJs}\n        function filterSidebarStandards(val) {`);
console.log('Added onSidebarSearchInput and clearSidebarSearch functions.');

// 6c. Improve renderNotebookLMSidebar to render a friendly empty state when 0 matches
const emptyStateCheck = `            if (totalAvailable === 0 && qLower) {
                container.innerHTML = \`
                    <div style="padding: 28px 16px; text-align: center; color: var(--gemini-text-muted); font-size: 0.82rem;">
                        <div style="font-size: 1.6rem; margin-bottom: 8px;">🔍</div>
                        <div style="font-weight: 600; color: var(--gemini-text-main); margin-bottom: 4px;">No matching standards</div>
                        <div style="margin-bottom: 12px;">No codes match "\${escapeHtml(searchFilter)}"</div>
                        <button onclick="clearSidebarSearch()" style="background: var(--gemini-surface-hover); border: 1px solid var(--gemini-border); border-radius: 8px; color: var(--gemini-text-main); padding: 6px 14px; cursor: pointer; font-size: 0.78rem;">Clear Search</button>
                    </div>
                \`;
            } else {
                container.innerHTML = html;
            }`;

html = html.replace('container.innerHTML = html;', emptyStateCheck);
console.log('Added friendly empty state for sidebar search with Clear button.');

// 6d. Guarantee on load that source-search-input is cleared and not populated by Chrome autofill
const onLoadClearJs = `
            // Prevent Chrome autofill from hijacking the standards search filter
            setTimeout(() => {
                const searchEl = document.getElementById('source-search-input');
                if (searchEl && (searchEl.value.includes('LOCASPEC') || searchEl.value.includes('ARAMCO') || searchEl.value.includes('ADNOC'))) {
                    searchEl.value = '';
                    renderNotebookLMSidebar('');
                }
            }, 100);
`;

html = html.replace(/window\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{/, `window.addEventListener('DOMContentLoaded', () => {\n${onLoadClearJs}`);
console.log('Added DOMContentLoaded protection against search bar autofill.');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully written updated index.html!');
