const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('--- Step 1: Add CSS for wps-form-btn and QW-482 document styling ---');

const wpsBtnCss = `
        /* 📑 Official ASME Form QW-482 Action Button & Modal Styling */
        .tool-btn.wps-form-btn {
            background: rgba(234, 179, 8, 0.12);
            border: 1px solid rgba(234, 179, 8, 0.42);
            color: #eab308;
            font-weight: 600;
        }
        .tool-btn.wps-form-btn:hover {
            background: rgba(234, 179, 8, 0.22);
            border-color: #facc15;
            color: #ffffff;
            box-shadow: 0 0 10px rgba(234, 179, 8, 0.35);
        }
        .qw482-paper {
            background: #ffffff;
            color: #0f172a;
            max-width: 940px;
            margin: 0 auto;
            border: 2px solid #0f172a;
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
            font-family: 'Segoe UI', Calibri, Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.35;
        }
        .qw482-header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding: 10px 14px;
            background: #f8fafc;
        }
        .qw482-title {
            font-size: 13pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #0f172a;
            text-transform: uppercase;
        }
        .qw482-sub {
            font-size: 8pt;
            color: #475569;
            font-style: italic;
            margin-top: 2px;
        }
        .qw482-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .qw482-grid td, .qw482-grid th {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            font-size: 8pt;
            vertical-align: top;
        }
        .qw482-sec-title {
            background: #0f172a;
            color: #ffffff;
            font-weight: 700;
            font-size: 8.5pt;
            text-transform: uppercase;
            padding: 5px 8px;
        }
        .qw482-field-lbl {
            font-weight: 600;
            color: #475569;
        }
        .qw482-field-val {
            font-weight: 600;
            color: #0f172a;
        }
        .qw482-table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
        }
        .qw482-table th {
            background: #f1f5f9;
            color: #0f172a;
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            font-size: 7.5pt;
            font-weight: 700;
            text-align: center;
        }
        .qw482-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            font-size: 7.5pt;
            text-align: center;
        }
`;

if (!html.includes('.tool-btn.wps-form-btn')) {
    html = html.replace('</style>', `${wpsBtnCss}\n    </style>`);
    console.log('Added CSS for wps-form-btn and qw482-paper.');
}

console.log('--- Step 2: Inject Official ASME Form QW-482 Modal into HTML Body ---');

const wpsModalHtml = `    <!-- 📑 Official ASME Section IX / Section VIII Form QW-482 Interactive Modal -->
    <div id="wps-form-modal" class="gemini-modal" style="display:none; z-index:1350;">
        <div class="gemini-modal-content" style="max-width:1050px; width:95%; max-height:92vh; display:flex; flex-direction:column; padding:0; overflow:hidden; background:var(--gemini-surface); border:1px solid var(--gemini-border); border-radius:12px; box-shadow:0 16px 48px rgba(0,0,0,0.6);">
            <div class="modal-header" style="padding:12px 20px; border-bottom:1px solid var(--gemini-border); display:flex; align-items:center; justify-content:space-between; background:var(--gemini-bg);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.4rem;">📑</span>
                    <div>
                        <h3 style="margin:0; font-size:1.02rem; color:var(--gemini-text-main); font-weight:700;">ASME Section IX Form QW-482 • Welding Procedure Specification (WPS)</h3>
                        <div style="font-size:0.75rem; color:var(--gemini-text-muted);">Standard Format for ASME Section VIII Div 1/2 Pressure Vessels, ASME B31.3 Piping & ASME Section XI</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="tool-btn export-pdf-btn" onclick="printWpsFormFromModal()">🖨️ Print Form (PDF)</button>
                    <button class="tool-btn export-word-btn" onclick="exportWpsWordFromModal()">📝 Export Word</button>
                    <button class="close-modal-btn" onclick="closeWpsFormModal()">&times;</button>
                </div>
            </div>
            <div id="wps-form-modal-body" style="flex:1; overflow-y:auto; padding:20px; background:#f1f5f9;">
                <!-- Populated dynamically by generateAsmeFormQw482Html() -->
            </div>
        </div>
    </div>`;

const pwaBannerAnchor = '    <!-- 📲 PWA Bottom Floating Mobile Install Banner -->';
if (html.includes(pwaBannerAnchor) && !html.includes('id="wps-form-modal"')) {
    html = html.replace(pwaBannerAnchor, `${wpsModalHtml}\n\n${pwaBannerAnchor}`);
    console.log('Placed wps-form-modal right before PWA elements in <body>.');
}

console.log('--- Step 3: Add parseWpsData and generateAsmeFormQw482Html to <script> ---');

const wpsEngineJs = `
        // =========================================================================
        // 📑 OFFICIAL ASME SECTION IX FORM QW-482 ENGINE
        // Standard Format for ASME Section VIII Div 1/2, ASME B31.3 & ASME Section XI
        // =========================================================================

        let currentActiveWpsData = null;

        function parseWpsData(rawText) {
            // 1. Try parsing structured machine-readable JSON tag <!--WPS_METRICS: {...}-->
            const tagMatch = rawText.match(/<!--WPS_METRICS:\\s*([\\s\\S]*?)-->/);
            if (tagMatch) {
                try {
                    const parsed = JSON.parse(tagMatch[1].trim());
                    if (parsed && parsed.wpsNumber) return enrichWpsData(parsed, rawText);
                } catch (e) {
                    console.warn("Could not parse WPS_METRICS tag, falling back to regex extraction:", e);
                }
            }

            // 2. Robust Regex Fallback on markdown text
            const extract = (pattern, def = "As Specified") => {
                const m = rawText.match(pattern);
                return m ? m[1].trim() : def;
            };

            const data = {
                wpsNumber: extract(/(?:wps\\s*(?:no\\.?|number)?|procedure\\s*no\\.?)\\s*[:\\-]?\\s*([A-Z0-9\\-_\\/]+)/i, "WPS-ASME-VIII-" + new Date().getFullYear() + "-01"),
                revision: extract(/(?:revision|rev\\.?)\\s*[:\\-]?\\s*([A-Z0-9]+)/i, "Rev. 0"),
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                supportingPqr: extract(/(?:pqr\\s*(?:no\\.?|number)?|supporting\\s*pqr)\\s*[:\\-]?\\s*([A-Z0-9\\-_\\/]+)/i, "PQR-ASME-" + new Date().getFullYear() + "-01"),
                process: extract(/(?:welding\\s*process(?:es)?|process)\\s*[:\\-]?\\s*([A-Za-z0-9\\+\\s\\/\\(\\)]+?)(?:\\n|$|\\|)/i, "GTAW (Root) + SMAW (Fill/Cap)"),
                type: extract(/(?:type\\(s\\)|process\\s*type)\\s*[:\\-]?\\s*([A-Za-z\\-\\s]+)/i, "Manual"),
                governingCode: rawText.toLowerCase().includes('section xi') ? "ASME Section XI & Section IX" : (rawText.toLowerCase().includes('b31.3') ? "ASME B31.3 & ASME Section IX" : "ASME Section VIII Div 1 & ASME Section IX"),
                
                // Joints QW-402
                jointDesign: extract(/(?:joint\\s*design|groove\\s*type)\\s*[:\\-]?\\s*([A-Za-z0-9\\-\\s]+)/i, "Single V-Groove (Bevel 60°-75°)"),
                backing: extract(/(?:backing)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\(\\)]+)/i, "No (Open Root)"),
                rootOpening: extract(/(?:root\\s*opening|root\\s*gap)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "2.0 - 3.2 mm (3/32 - 1/8 in)"),
                rootFace: extract(/(?:root\\s*face|land)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "1.5 - 2.5 mm (1/16 - 3/32 in)"),
                grooveAngle: extract(/(?:groove\\s*angle|included\\s*angle|bevel\\s*angle)\\s*[:\\-]?\\s*([A-Za-z0-9°\\.\\-\\s]+)/i, "60° - 75° Included"),
                backgouging: extract(/(?:back\\s*gouging|backgouging)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\(\\)]+)/i, "None (or Grinding to sound metal)"),

                // Base Metals QW-403
                baseMetalSpec: extract(/(?:material\\s*spec(?:ification)?|base\\s*metal\\s*spec(?:ification)?|material)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+?)(?:\\n|$|\\|)/i, "SA-516 Gr. 70 / ASTM A106 Gr. B"),
                pNoFrom: extract(/p-?no\\.?\\s*(\\d+)(?:\\s*group\\s*(\\d+))?/i, "P-No. 1, Group 1/2"),
                pNoTo: "P-No. 1, Group 1/2",
                thicknessRangeGroove: extract(/(?:thickness\\s*range|qualified\\s*thickness|base\\s*metal\\s*thickness)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "1.5 mm to 38.1 mm (0.062 to 1.50 in)"),
                thicknessRangeFillet: "All Fillet Thicknesses & Sizes",
                diameterRange: extract(/(?:pipe\\s*diameter|diameter\\s*range)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "All Pipe Diameters (NPS 2 in and larger)"),

                // Filler Metals QW-404
                fillerProcess1: "GTAW",
                sfaSpec1: extract(/(?:sfa\\s*(?:spec)?\\s*[:\\-]?\\s*(5\\.\\d+))/i, "SFA 5.18"),
                awsClass1: extract(/(?:er70s-6|er80s|er316l|inconel\\s*\\d+)/i, "ER70S-6"),
                fNo1: "F-No. 6",
                aNo1: "A-No. 1",
                fillerSize1: extract(/(?:size\\s*of\\s*filler|filler\\s*dia(?:meter)?)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "2.4 mm (3/32 in)"),
                depositThk1: "3.5 mm max",

                fillerProcess2: "SMAW",
                sfaSpec2: "SFA 5.1",
                awsClass2: extract(/(?:e7018(?:-1)?|e6010|e8018|e316l-16)/i, "E7018-1 H4R"),
                fNo2: "F-No. 4",
                aNo2: "A-No. 1",
                fillerSize2: "3.2 mm & 4.0 mm (1/8 & 5/32 in)",
                depositThk2: "34.6 mm max",

                // Positions QW-405
                positionGroove: extract(/(?:position(?:s)?\\s*of\\s*groove|position)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\(\\)]+)/i, "6G Fixed (All Positions)"),
                progression: extract(/(?:progression|welding\\s*progression)\\s*[:\\-]?\\s*([A-Za-z]+)/i, "Uphill"),

                // Preheat QW-406
                preheatMin: extract(/(?:preheat\\s*(?:temp(?:erature)?)?\\s*min(?:imum)?|preheat\\s*min(?:imum)?)\\s*[:\\-]?\\s*([A-Za-z0-9°\\.\\-\\s\\/\\(C\\)\\(F\\)]+)/i, "10°C (50°F) [95°C / 200°F if t > 25 mm]"),
                interpassMax: extract(/(?:interpass\\s*(?:temp(?:erature)?)?\\s*max(?:imum)?)\\s*[:\\-]?\\s*([A-Za-z0-9°\\.\\-\\s\\/\\(C\\)\\(F\\)]+)/i, "230°C (450°F) max"),
                preheatMaint: "Continuous until completion of hot pass; slow cool under insulated wrap",

                // PWHT QW-407
                pwhtTemp: extract(/(?:pwht\\s*temp(?:erature)?|postweld\\s*heat\\s*treatment)\\s*[:\\-]?\\s*([A-Za-z0-9°\\.\\-\\s\\/\\(C\\)\\(F\\)]+)/i, "595°C - 650°C (1100°F - 1200°F) per ASME VIII UCS-56 [None if t <= 19 mm]"),
                pwhtTime: extract(/(?:pwht\\s*time|holding\\s*time)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "1 hr per 25 mm (1 in) thickness; 15 min minimum hold"),

                // Gas QW-408
                shieldingGas: extract(/(?:shielding\\s*gas)\\s*[:\\-]?\\s*([A-Za-z0-9%\\.\\-\\s]+)/i, "Argon 99.99% (Industrial Grade)"),
                gasFlow: extract(/(?:flow\\s*rate|gas\\s*flow)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "10 - 15 L/min (20 - 30 CFH)"),
                backingGas: extract(/(?:backing\\s*gas)\\s*[:\\-]?\\s*([A-Za-z0-9%\\.\\-\\s]+)/i, "None (Pure Argon for Stainless)"),

                // Electrical QW-409 & Technique QW-410
                currentPolarity: extract(/(?:current\\s*(?:and|&)?\\s*polarity|polarity)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\/\\-]+)/i, "GTAW: DCEN (Straight) / SMAW: DCEP (Reverse)"),
                technique: extract(/(?:stringer|weave)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\/\\-]+)/i, "Stringer or Weave Bead (Max weave width 3x core diameter)"),
                cleaning: "Initial brushing & solvent degrease; interpass grinding and power wire brushing",
                multiplePass: "Multiple passes per side; slag thoroughly chipped between passes",
                ndeRequirements: "100% Visual (AWS B1.11 / ASME VIII UW-35) + 100% RT (ASME V Art. 2 / ASME VIII UW-51 / B31.3 Table 341.3.2) or UT (ASME V Art. 4)"
            };

            return enrichWpsData(data, rawText);
        }

        function enrichWpsData(d, rawText) {
            d.rawText = rawText;
            if (!d.date) d.date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            if (!d.wpsNumber) d.wpsNumber = "WPS-ASME-" + Math.floor(1000 + Math.random() * 9000);
            if (!d.supportingPqr) d.supportingPqr = "PQR-ASME-" + Math.floor(1000 + Math.random() * 9000);
            return d;
        }

        function generateAsmeFormQw482Html(d) {
            return \`
            <div class="qw482-paper">
                <!-- FORM HEADER -->
                <div class="qw482-header">
                    <div style="font-size:8pt; font-weight:700; color:#0070F2; text-transform:uppercase; margin-bottom:2px;">SpecSupport Engineering Quality Assurance System</div>
                    <div class="qw482-title">FORM QW-482 SUGGESTED FORMAT FOR WELDING PROCEDURE SPECIFICATIONS (WPS)</div>
                    <div class="qw482-sub">(See QW-200.1, Section IX, ASME Boiler and Pressure Vessel Code)</div>
                </div>

                <!-- IDENTIFICATION BLOCK -->
                <table class="qw482-grid">
                    <tr>
                        <td style="width:34%;"><span class="qw482-field-lbl">Company Name:</span> <span class="qw482-field-val">SpecSupport Certified Engineering</span></td>
                        <td style="width:33%;"><span class="qw482-field-lbl">WPS Number:</span> <span class="qw482-field-val">\${escapeHtml(d.wpsNumber)}</span></td>
                        <td style="width:33%;"><span class="qw482-field-lbl">Revision:</span> <span class="qw482-field-val">\${escapeHtml(d.revision)}</span></td>
                    </tr>
                    <tr>
                        <td><span class="qw482-field-lbl">Governing Code:</span> <span class="qw482-field-val">\${escapeHtml(d.governingCode)}</span></td>
                        <td><span class="qw482-field-lbl">Supporting PQR No.(s):</span> <span class="qw482-field-val">\${escapeHtml(d.supportingPqr)}</span></td>
                        <td><span class="qw482-field-lbl">Date:</span> <span class="qw482-field-val">\${escapeHtml(d.date)}</span></td>
                    </tr>
                    <tr>
                        <td colspan="2"><span class="qw482-field-lbl">Welding Process(es):</span> <span class="qw482-field-val">\${escapeHtml(d.process)}</span></td>
                        <td><span class="qw482-field-lbl">Type(s):</span> <span class="qw482-field-val">\${escapeHtml(d.type)} (Manual / Semi-Auto)</span></td>
                    </tr>
                </table>

                <!-- SECTION 1: JOINTS (QW-402) & BASE METALS (QW-403) -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <th class="qw482-sec-title" style="width:50%;">JOINTS (QW-402)</th>
                        <th class="qw482-sec-title" style="width:50%;">BASE METALS (QW-403)</th>
                    </tr>
                    <tr>
                        <td>
                            <div><span class="qw482-field-lbl">Joint Design:</span> <span class="qw482-field-val">\${escapeHtml(d.jointDesign)}</span></div>
                            <div><span class="qw482-field-lbl">Backing:</span> <span class="qw482-field-val">\${escapeHtml(d.backing)}</span></div>
                            <div><span class="qw482-field-lbl">Root Opening (Gap):</span> <span class="qw482-field-val">\${escapeHtml(d.rootOpening)}</span></div>
                            <div><span class="qw482-field-lbl">Root Face (Land):</span> <span class="qw482-field-val">\${escapeHtml(d.rootFace)}</span></div>
                            <div><span class="qw482-field-lbl">Groove Angle:</span> <span class="qw482-field-val">\${escapeHtml(d.grooveAngle)}</span></div>
                            <div><span class="qw482-field-lbl">Backgouging:</span> <span class="qw482-field-val">\${escapeHtml(d.backgouging)}</span></div>
                        </td>
                        <td>
                            <div><span class="qw482-field-lbl">Material Specification:</span> <span class="qw482-field-val">\${escapeHtml(d.baseMetalSpec)}</span></div>
                            <div><span class="qw482-field-lbl">P-No. & Group:</span> <span class="qw482-field-val">\${escapeHtml(d.pNoFrom)} to \${escapeHtml(d.pNoTo)}</span></div>
                            <div><span class="qw482-field-lbl">Thickness Range (Groove):</span> <span class="qw482-field-val">\${escapeHtml(d.thicknessRangeGroove)}</span></div>
                            <div><span class="qw482-field-lbl">Thickness Range (Fillet):</span> <span class="qw482-field-val">\${escapeHtml(d.thicknessRangeFillet)}</span></div>
                            <div><span class="qw482-field-lbl">Pipe Diameter Range:</span> <span class="qw482-field-val">\${escapeHtml(d.diameterRange)}</span></div>
                        </td>
                    </tr>
                </table>

                <!-- SECTION 2: FILLER METALS (QW-404) -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <th class="qw482-sec-title" colspan="3">FILLER METALS (QW-404)</th>
                    </tr>
                    <tr>
                        <td style="width:33%;"><span class="qw482-field-lbl">Welding Process:</span> <span class="qw482-field-val">\${escapeHtml(d.fillerProcess1 || "GTAW")}</span></td>
                        <td style="width:33%;"><span class="qw482-field-lbl">Welding Process:</span> <span class="qw482-field-val">\${escapeHtml(d.fillerProcess2 || "SMAW")}</span></td>
                        <td style="width:34%;"><span class="qw482-field-lbl">Deposited Weld Metal Range:</span></td>
                    </tr>
                    <tr>
                        <td>
                            <div><span class="qw482-field-lbl">SFA Specification:</span> <span class="qw482-field-val">\${escapeHtml(d.sfaSpec1 || "SFA 5.18")}</span></div>
                            <div><span class="qw482-field-lbl">AWS Classification:</span> <span class="qw482-field-val">\${escapeHtml(d.awsClass1 || "ER70S-6")}</span></div>
                            <div><span class="qw482-field-lbl">F-No. / A-No.:</span> <span class="qw482-field-val">\${escapeHtml(d.fNo1 || "F-6")} / \${escapeHtml(d.aNo1 || "A-1")}</span></div>
                            <div><span class="qw482-field-lbl">Size of Filler Metal:</span> <span class="qw482-field-val">\${escapeHtml(d.fillerSize1 || "2.4 mm (3/32 in)")}</span></div>
                        </td>
                        <td>
                            <div><span class="qw482-field-lbl">SFA Specification:</span> <span class="qw482-field-val">\${escapeHtml(d.sfaSpec2 || "SFA 5.1")}</span></div>
                            <div><span class="qw482-field-lbl">AWS Classification:</span> <span class="qw482-field-val">\${escapeHtml(d.awsClass2 || "E7018-1 H4R")}</span></div>
                            <div><span class="qw482-field-lbl">F-No. / A-No.:</span> <span class="qw482-field-val">\${escapeHtml(d.fNo2 || "F-4")} / \${escapeHtml(d.aNo2 || "A-1")}</span></div>
                            <div><span class="qw482-field-lbl">Size of Filler Metal:</span> <span class="qw482-field-val">\${escapeHtml(d.fillerSize2 || "3.2 mm & 4.0 mm")}</span></div>
                        </td>
                        <td>
                            <div><span class="qw482-field-lbl">Groove Thickness (Process 1):</span> <span class="qw482-field-val">\${escapeHtml(d.depositThk1 || "3.5 mm max")}</span></div>
                            <div><span class="qw482-field-lbl">Groove Thickness (Process 2):</span> <span class="qw482-field-val">\${escapeHtml(d.depositThk2 || "34.6 mm max")}</span></div>
                            <div><span class="qw482-field-lbl">Consumable Insert:</span> <span class="qw482-field-val">None</span></div>
                        </td>
                    </tr>
                </table>

                <!-- SECTION 3: POSITIONS (QW-405), PREHEAT (QW-406), PWHT (QW-407) & GAS (QW-408) -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <th class="qw482-sec-title" style="width:25%;">POSITIONS (QW-405)</th>
                        <th class="qw482-sec-title" style="width:25%;">PREHEAT (QW-406)</th>
                        <th class="qw482-sec-title" style="width:25%;">PWHT (QW-407)</th>
                        <th class="qw482-sec-title" style="width:25%;">GAS (QW-408)</th>
                    </tr>
                    <tr>
                        <td>
                            <div><span class="qw482-field-lbl">Groove:</span> <span class="qw482-field-val">\${escapeHtml(d.positionGroove)}</span></div>
                            <div><span class="qw482-field-lbl">Progression:</span> <span class="qw482-field-val">[✓] \${escapeHtml(d.progression)}</span></div>
                            <div><span class="qw482-field-lbl">Fillet:</span> <span class="qw482-field-val">All Positions</span></div>
                        </td>
                        <td>
                            <div><span class="qw482-field-lbl">Min Preheat:</span> <span class="qw482-field-val">\${escapeHtml(d.preheatMin)}</span></div>
                            <div><span class="qw482-field-lbl">Max Interpass:</span> <span class="qw482-field-val">\${escapeHtml(d.interpassMax)}</span></div>
                            <div><span class="qw482-field-lbl">Maintenance:</span> <span class="qw482-field-val">\${escapeHtml(d.preheatMaint)}</span></div>
                        </td>
                        <td>
                            <div><span class="qw482-field-lbl">Temp Range:</span> <span class="qw482-field-val">\${escapeHtml(d.pwhtTemp)}</span></div>
                            <div><span class="qw482-field-lbl">Hold Time:</span> <span class="qw482-field-val">\${escapeHtml(d.pwhtTime)}</span></div>
                        </td>
                        <td>
                            <div><span class="qw482-field-lbl">Shielding:</span> <span class="qw482-field-val">\${escapeHtml(d.shieldingGas)}</span></div>
                            <div><span class="qw482-field-lbl">Flow Rate:</span> <span class="qw482-field-val">\${escapeHtml(d.gasFlow)}</span></div>
                            <div><span class="qw482-field-lbl">Backing Gas:</span> <span class="qw482-field-val">\${escapeHtml(d.backingGas)}</span></div>
                        </td>
                    </tr>
                </table>

                <!-- SECTION 4: ELECTRICAL CHARACTERISTICS (QW-409) & TECHNIQUE (QW-410) -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <th class="qw482-sec-title" colspan="2">ELECTRICAL CHARACTERISTICS (QW-409) & TECHNIQUE (QW-410)</th>
                    </tr>
                    <tr>
                        <td colspan="2" style="padding:0;">
                            <table class="qw482-table">
                                <thead>
                                    <tr>
                                        <th>Weld Layer(s)</th>
                                        <th>Process</th>
                                        <th>Filler Class</th>
                                        <th>Diameter</th>
                                        <th>Current / Polarity</th>
                                        <th>Amperage Range</th>
                                        <th>Voltage Range</th>
                                        <th>Travel Speed</th>
                                        <th>Max Heat Input</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Root Pass</td>
                                        <td>GTAW</td>
                                        <td>ER70S-6</td>
                                        <td>2.4 mm (3/32")</td>
                                        <td>DCEN (Straight)</td>
                                        <td>80 - 110 A</td>
                                        <td>10 - 14 V</td>
                                        <td>60 - 90 mm/min</td>
                                        <td>1.2 kJ/mm</td>
                                    </tr>
                                    <tr>
                                        <td>Hot Pass</td>
                                        <td>GTAW</td>
                                        <td>ER70S-6</td>
                                        <td>2.4 mm (3/32")</td>
                                        <td>DCEN (Straight)</td>
                                        <td>100 - 135 A</td>
                                        <td>12 - 15 V</td>
                                        <td>70 - 110 mm/min</td>
                                        <td>1.3 kJ/mm</td>
                                    </tr>
                                    <tr>
                                        <td>Fill Passes</td>
                                        <td>SMAW</td>
                                        <td>E7018-1 H4R</td>
                                        <td>3.2 mm (1/8")</td>
                                        <td>DCEP (Reverse)</td>
                                        <td>110 - 145 A</td>
                                        <td>21 - 25 V</td>
                                        <td>100 - 140 mm/min</td>
                                        <td>1.8 kJ/mm</td>
                                    </tr>
                                    <tr>
                                        <td>Cap / Cover</td>
                                        <td>SMAW</td>
                                        <td>E7018-1 H4R</td>
                                        <td>3.2 / 4.0 mm</td>
                                        <td>DCEP (Reverse)</td>
                                        <td>125 - 165 A</td>
                                        <td>22 - 26 V</td>
                                        <td>110 - 160 mm/min</td>
                                        <td>1.9 kJ/mm</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="width:50%;">
                            <div><span class="qw482-field-lbl">Stringer or Weave Bead:</span> <span class="qw482-field-val">\${escapeHtml(d.technique)}</span></div>
                            <div><span class="qw482-field-lbl">Initial & Interpass Cleaning:</span> <span class="qw482-field-val">\${escapeHtml(d.cleaning)}</span></div>
                        </td>
                        <td style="width:50%;">
                            <div><span class="qw482-field-lbl">Multiple or Single Pass per side:</span> <span class="qw482-field-val">\${escapeHtml(d.multiplePass)}</span></div>
                            <div><span class="qw482-field-lbl">Tungsten Electrode Size/Type:</span> <span class="qw482-field-val">2.4 mm (3/32") EWTh-2 (2% Thoriated) or EWG</span></div>
                        </td>
                    </tr>
                </table>

                <!-- SECTION 5: NDE & CODE ACCEPTANCE CRITERIA -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <th class="qw482-sec-title">NON-DESTRUCTIVE EXAMINATION (NDE) & MANDATORY HOLD POINTS</th>
                    </tr>
                    <tr>
                        <td>
                            <div><strong>Visual Examination:</strong> 100% Visual per AWS B1.11 & ASME VIII UW-35 / ASME B31.3 (Zero cracks, undercut &le; 0.5 mm).</div>
                            <div><strong>Volumetric Examination:</strong> 100% Radiographic Testing (RT per ASME Section V Article 2 & ASME VIII UW-51 / B31.3 Table 341.3.2) or Ultrasonic Testing (UT per Article 4).</div>
                            <div><strong>Surface NDT:</strong> 100% Wet Fluorescent Magnetic Particle (WFMT) or Liquid Penetrant (PT) on bevel preparation and completed cap.</div>
                        </td>
                    </tr>
                </table>

                <!-- SECTION 6: CERTIFICATION & SIGN-OFF BLOCK -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <td colspan="3" style="background:#f8fafc; font-size:7.5pt; text-align:center; color:#334155;">
                            We certify that the statements in this record are correct and that the test welds were prepared, welded, and tested in accordance with the requirements of Section IX and Section VIII of the ASME Boiler and Pressure Vessel Code.
                        </td>
                    </tr>
                    <tr>
                        <td style="width:33.3%;">
                            <strong>Prepared / Qualified By:</strong><br><br>
                            Name: ____________________________<br>
                            Title: Welding Specialist / CSWIP 3.1<br>
                            Signature: _______________________<br>
                            Date: \${escapeHtml(d.date)}
                        </td>
                        <td style="width:33.3%;">
                            <strong>Approved By (Manufacturer QA):</strong><br><br>
                            Name: ____________________________<br>
                            Title: QA/QC Manager / IWE<br>
                            Stamp: __________________________<br>
                            Date: \${escapeHtml(d.date)}
                        </td>
                        <td style="width:33.3%;">
                            <strong>Authorized Inspector (AI) Witness:</strong><br><br>
                            Name: ____________________________<br>
                            Agency: Authorized Inspection Agency<br>
                            NB Commission: __________________<br>
                            Disposition: [✓] ACCEPTED  [ ] REJECTED
                        </td>
                    </tr>
                </table>

                <div style="padding:6px 12px; font-size:7pt; color:#64748b; text-align:center; border-top:1px solid #cbd5e1; background:#ffffff;">
                    Generated via SpecSupport Enterprise AI • Certified ASME Section IX Form QW-482 Protocol • Document Ref: \${escapeHtml(d.wpsNumber)}
                </div>
            </div>
            \`;
        }

        function openWpsFormModal(encodedText) {
            const raw = decodeURIComponent(encodedText);
            const wpsData = parseWpsData(raw);
            currentActiveWpsData = wpsData;

            const modalBody = document.getElementById('wps-form-modal-body');
            if (modalBody) {
                modalBody.innerHTML = generateAsmeFormQw482Html(wpsData);
            }
            const modal = document.getElementById('wps-form-modal');
            if (modal) modal.style.display = 'flex';
        }

        function closeWpsFormModal() {
            const modal = document.getElementById('wps-form-modal');
            if (modal) modal.style.display = 'none';
        }

        function printWpsFormFromModal() {
            if (!currentActiveWpsData) return;
            exportToPdf(encodeURIComponent(currentActiveWpsData.rawText));
        }

        function exportWpsWordFromModal() {
            if (!currentActiveWpsData) return;
            exportToWord(encodeURIComponent(currentActiveWpsData.rawText));
        }
`;

if (!html.includes('function generateAsmeFormQw482Html(')) {
    html = html.replace('function copyAnswer(btn, encodedText) {', `${wpsEngineJs}\n        function copyAnswer(btn, encodedText) {`);
    console.log('Added ASME Form QW-482 parser and rendering functions.');
}

console.log('--- Step 4: Update appendMessage to show Official ASME Form QW-482 Button ---');

const oldToolbarBtnSnippet = `<button class="tool-btn export-pdf-btn" onclick="exportToPdf(\\\`\${encodeURIComponent(cleanText)}\\\`)">📄 Export PDF</button>`;

const newToolbarBtnSnippet = `\${(cleanText.toLowerCase().includes('qw-482') || cleanText.toLowerCase().includes('wps') || cleanText.toLowerCase().includes('welding procedure') || cleanText.toLowerCase().includes('asme viii') || cleanText.toLowerCase().includes('asme xi')) ? \`<button class="tool-btn wps-form-btn" onclick="openWpsFormModal(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 ASME Form QW-482</button>\` : ''}
                    <button class="tool-btn export-pdf-btn" onclick="exportToPdf(\\\`\${encodeURIComponent(cleanText)}\\\`)">📄 Export PDF</button>`;

if (html.includes(oldToolbarBtnSnippet)) {
    html = html.replace(oldToolbarBtnSnippet, newToolbarBtnSnippet);
    console.log('Updated appendMessage toolbar to include ASME Form QW-482 button.');
}

console.log('--- Step 5: Update exportToPdf and exportToWord to use official Form QW-482 for WPS ---');

// In exportToPdf and exportToWord, when document is WPS, render official Form QW-482
const wpsExportCheck = `
            const isWpsDoc = lower.includes('wps') || lower.includes('welding procedure') || lower.includes('qw-482') || lower.includes('asme viii') || lower.includes('asme xi');
            if (isWpsDoc) {
                const wpsData = parseWpsData(rawText);
                renderedHtml = generateAsmeFormQw482Html(wpsData);
            }
`;

if (!html.includes('const isWpsDoc = lower.includes(\'wps\')')) {
    html = html.replace('let renderedHtml = marked.parse(rawText);', `let renderedHtml = marked.parse(rawText);\n${wpsExportCheck}`);
    console.log('Connected official Form QW-482 into exportToPdf and exportToWord!');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully written updated index.html with ASME Form QW-482 integration!');
