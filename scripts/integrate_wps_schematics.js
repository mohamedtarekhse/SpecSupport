const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Ensure duplicate button is cleaned up in toolbar (line 6615 & 6616)
const duplicateBtn = `${(html.includes('📑 ASME Form QW-482') ? '' : '')}`;
html = html.replace(
    /\$\{\(cleanText\.toLowerCase\(\)\.includes\('qw-482'\)[\s\S]*?` : ''\}\s*\$\{\(cleanText\.toLowerCase\(\)\.includes\('qw-482'\)[\s\S]*?` : ''\}/,
    `\${(cleanText.toLowerCase().includes('qw-482') || cleanText.toLowerCase().includes('wps') || cleanText.toLowerCase().includes('welding procedure') || cleanText.toLowerCase().includes('asme viii') || cleanText.toLowerCase().includes('asme xi')) ? \`<button class="tool-btn wps-form-btn" onclick="openWpsFormModal(\\\`\${encodeURIComponent(cleanText)}\\\`)">📑 ASME Form QW-482</button>\` : ''}`
);

// Add SVG generator function before generateAsmeFormQw482Html
const svgFunctionCode = `
        function generateWeldingJointSvg(d) {
            const isFillet = (d.jointDesign && d.jointDesign.toLowerCase().includes('fillet')) || 
                             (d.thicknessRangeFillet && d.thicknessRangeFillet.toLowerCase().includes('only'));

            const bevelAngle = d.grooveAngle || "60° - 75°";
            const rootOpening = d.rootOpening || "2.0 - 3.2 mm";
            const rootFace = d.rootFace || "1.5 - 2.5 mm";
            const thickness = d.nominalThickness || (d.thicknessRangeGroove ? d.thicknessRangeGroove.split(' ')[0] + ' mm' : "12.7 mm");
            const capReinf = d.capReinforcement || "1.5 - 3.0 mm";
            const filletLeg = d.filletSize || "8.0 - 10.0 mm";

            if (isFillet) {
                return \`
                <svg viewBox="0 0 480 200" width="100%" height="185" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-family:'Segoe UI', Calibri, sans-serif;">
                    <defs>
                        <marker id="wps-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0070F2"/>
                        </marker>
                        <marker id="wps-arrow-dark" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#334155"/>
                        </marker>
                        <pattern id="wps-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" stroke-width="1.2" />
                        </pattern>
                    </defs>

                    <!-- Base Member (Horizontal) -->
                    <rect x="70" y="130" width="340" height="35" fill="url(#wps-hatch)" stroke="#334155" stroke-width="1.8"/>
                    <rect x="70" y="130" width="340" height="35" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="1.8"/>

                    <!-- Attached Member (Vertical T-Joint) -->
                    <rect x="215" y="25" width="45" height="105" fill="url(#wps-hatch)" stroke="#334155" stroke-width="1.8"/>
                    <rect x="215" y="25" width="45" height="105" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="1.8"/>

                    <!-- Fillet Weld Bead Left -->
                    <path d="M 180 130 Q 205 122 215 95 L 215 130 Z" fill="#93c5fd" stroke="#0070F2" stroke-width="1.6"/>
                    <!-- Fillet Weld Bead Right -->
                    <path d="M 260 95 Q 270 122 295 130 L 260 130 Z" fill="#93c5fd" stroke="#0070F2" stroke-width="1.6"/>

                    <!-- Dimension: Vertical Plate Thickness -->
                    <line x1="215" y1="18" x2="260" y2="18" stroke="#0070F2" stroke-width="1.4" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                    <text x="237" y="12" fill="#0070F2" font-size="9" font-weight="700" text-anchor="middle">Thickness (t): \${escapeHtml(thickness)}</text>

                    <!-- Dimension: Fillet Leg Length (Vertical) -->
                    <line x1="172" y1="95" x2="172" y2="130" stroke="#0070F2" stroke-width="1.4" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                    <text x="166" y="115" fill="#0070F2" font-size="8.5" font-weight="700" text-anchor="end">Leg (z): \${escapeHtml(filletLeg)}</text>

                    <!-- Dimension: Fillet Leg Length (Horizontal) -->
                    <line x1="260" y1="142" x2="295" y2="142" stroke="#0070F2" stroke-width="1.4" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                    <text x="277" y="154" fill="#0070F2" font-size="8.5" font-weight="700" text-anchor="middle">Leg (z): \${escapeHtml(filletLeg)}</text>

                    <!-- Theoretical Throat Check -->
                    <path d="M 260 95 L 295 130" stroke="#64748b" stroke-dasharray="2 2" stroke-width="1"/>
                    <text x="310" y="112" fill="#0f172a" font-size="8" font-weight="700">Theoretical Throat (a) &le; 0.707 &times; z</text>

                    <!-- Title & Code Callout -->
                    <text x="15" y="20" fill="#0f172a" font-size="9.5" font-weight="800">QW-402 FILLET / T-JOINT SCHEMATIC</text>
                    <text x="15" y="32" fill="#64748b" font-size="7.5">ASME Section IX &bull; Fillet Size &amp; Throat Profile</text>
                </svg>\`;
            }

            // Default: Single V-Groove Butt Weld schematic with Bevel, Root Face, Root Opening, Cap, and Thickness
            return \`
            <svg viewBox="0 0 520 205" width="100%" height="190" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:4px; font-family:'Segoe UI', Calibri, sans-serif;">
                <defs>
                    <marker id="wps-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0070F2"/>
                    </marker>
                    <marker id="wps-arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#dc2626"/>
                    </marker>
                    <pattern id="wps-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" stroke-width="1.2" />
                    </pattern>
                </defs>

                <!-- Plate 1 (Left Base Metal) -->
                <polygon points="50,55 210,55 230,115 230,135 50,135" fill="url(#wps-hatch)" stroke="#334155" stroke-width="1.8"/>
                <polygon points="50,55 210,55 230,115 230,135 50,135" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="1.8"/>

                <!-- Plate 2 (Right Base Metal) -->
                <polygon points="270,115 290,55 450,55 450,135 270,135" fill="url(#wps-hatch)" stroke="#334155" stroke-width="1.8"/>
                <polygon points="270,115 290,55 450,55 450,135 270,135" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="1.8"/>

                <!-- Deposited Weld Metal Layers -->
                <!-- Root Pass -->
                <path d="M 230 135 Q 250 143 270 135 L 268 117 Q 250 121 232 117 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.1"/>
                <!-- Fill Passes -->
                <path d="M 232 117 Q 250 121 268 117 L 285 70 Q 250 73 215 70 Z" fill="#93c5fd" stroke="#0070F2" stroke-width="1.1"/>
                <!-- Cap / Crown Reinforcement -->
                <path d="M 205 55 Q 250 38 295 55 Q 250 51 205 55 Z" fill="#60a5fa" stroke="#1d4ed8" stroke-width="1.4"/>

                <!-- DIMENSION: Base Metal Thickness (t) -->
                <line x1="38" y1="55" x2="38" y2="135" stroke="#0070F2" stroke-width="1.4" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                <text x="32" y="98" fill="#0070F2" font-size="8.5" font-weight="700" text-anchor="end">Wall (t): \${escapeHtml(thickness)}</text>

                <!-- DIMENSION: Bevel Angle / Included Angle (QW-402) -->
                <path d="M 224 75 Q 250 83 276 75" fill="none" stroke="#dc2626" stroke-width="1.3" marker-start="url(#wps-arrow-red)" marker-end="url(#wps-arrow-red)"/>
                <text x="250" y="96" fill="#dc2626" font-size="9" font-weight="700" text-anchor="middle">Bevel: \${escapeHtml(bevelAngle)}</text>

                <!-- DIMENSION: Root Opening / Gap (R) -->
                <line x1="230" y1="146" x2="270" y2="146" stroke="#0070F2" stroke-width="1.4" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                <text x="250" y="159" fill="#0070F2" font-size="8.5" font-weight="700" text-anchor="middle">Root Gap (R): \${escapeHtml(rootOpening)}</text>

                <!-- DIMENSION: Root Face / Land (f) -->
                <line x1="280" y1="115" x2="280" y2="135" stroke="#0070F2" stroke-width="1.3" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                <text x="288" y="128" fill="#0070F2" font-size="8.5" font-weight="700">Root Land (f): \${escapeHtml(rootFace)}</text>

                <!-- DIMENSION: Weld Cap / Crown Reinforcement -->
                <line x1="305" y1="40" x2="305" y2="55" stroke="#1d4ed8" stroke-width="1.3" marker-start="url(#wps-arrow)" marker-end="url(#wps-arrow)"/>
                <text x="314" y="49" fill="#1d4ed8" font-size="8.5" font-weight="700">Cap Height: \${escapeHtml(capReinf)}</text>

                <!-- Root Penetration & Undercut Limits -->
                <line x1="250" y1="141" x2="250" y2="175" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2"/>
                <text x="250" y="186" fill="#475569" font-size="7.5" text-anchor="middle">Root Penetration (Flush to +1.5 mm)</text>

                <!-- Title / ASME Standard Tag -->
                <text x="15" y="20" fill="#0f172a" font-size="9.5" font-weight="800">QW-402 GROOVE JOINT SCHEMATIC &amp; PASS PROFILE</text>
                <text x="15" y="32" fill="#64748b" font-size="7.5">ASME Boiler &amp; Pressure Vessel Code Section IX &bull; Form QW-482</text>
            </svg>\`;
        }
`;

// Insert svgFunctionCode right before function generateAsmeFormQw482Html
html = html.replace('function generateAsmeFormQw482Html(d) {', svgFunctionCode + '\n        function generateAsmeFormQw482Html(d) {');

// In parseWpsData, add capReinforcement and filletSize extraction
const parseOldTarget = `backgouging: extract(/(?:back\\s*gouging|backgouging)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\(\\)]+)/i, "None (or Grinding to sound metal)"),`;
const parseNewTarget = `backgouging: extract(/(?:back\\s*gouging|backgouging)\\s*[:\\-]?\\s*([A-Za-z0-9\\s\\(\\)]+)/i, "None (or Grinding to sound metal)"),
                capReinforcement: extract(/(?:cap\\s*reinforcement|weld\\s*reinforcement|crown\\s*height|cap\\s*height)\\s*[:\\-]?\\s*([A-Za-z0-9°\\.\\-\\s\\/]+)/i, "1.5 - 3.0 mm (max per UW-35)"),
                filletSize: extract(/(?:fillet\\s*size|fillet\\s*leg|leg\\s*size)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "Equal to or exceeding thinner member"),
                nominalThickness: extract(/(?:nominal\\s*thickness|wall\\s*thickness|thickness)\\s*[:\\-]?\\s*([A-Za-z0-9\\.\\-\\s\\/]+)/i, "12.7 mm (1/2 in)"),`;

html = html.replace(parseOldTarget, parseNewTarget);

// In generateAsmeFormQw482Html, embed the SVG right into Section 1 JOINTS (QW-402)
const jointsOldHtml = `<!-- SECTION 1: JOINTS (QW-402) & BASE METALS (QW-403) -->
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
                        </td>`;

const jointsNewHtml = `<!-- SECTION 1: JOINTS (QW-402) & BASE METALS (QW-403) -->
                <table class="qw482-grid" style="border-top:2px solid #0f172a;">
                    <tr>
                        <th class="qw482-sec-title" style="width:50%;">JOINTS (QW-402) &amp; WELD SCHEMATIC</th>
                        <th class="qw482-sec-title" style="width:50%;">BASE METALS (QW-403)</th>
                    </tr>
                    <tr>
                        <td>
                            <div style="margin-bottom:8px;">
                                \${generateWeldingJointSvg(d)}
                            </div>
                            <div><span class="qw482-field-lbl">Joint Design:</span> <span class="qw482-field-val">\${escapeHtml(d.jointDesign)}</span></div>
                            <div><span class="qw482-field-lbl">Backing:</span> <span class="qw482-field-val">\${escapeHtml(d.backing)}</span></div>
                            <div><span class="qw482-field-lbl">Root Opening (Gap):</span> <span class="qw482-field-val">\${escapeHtml(d.rootOpening)}</span></div>
                            <div><span class="qw482-field-lbl">Root Face (Land):</span> <span class="qw482-field-val">\${escapeHtml(d.rootFace)}</span></div>
                            <div><span class="qw482-field-lbl">Groove Angle:</span> <span class="qw482-field-val">\${escapeHtml(d.grooveAngle)}</span></div>
                            <div><span class="qw482-field-lbl">Cap Reinforcement:</span> <span class="qw482-field-val">\${escapeHtml(d.capReinforcement || "1.5 - 3.0 mm (max)")}</span></div>
                            <div><span class="qw482-field-lbl">Fillet Leg / Throat:</span> <span class="qw482-field-val">\${escapeHtml(d.filletSize || "All Thicknesses")}</span></div>
                            <div><span class="qw482-field-lbl">Backgouging:</span> <span class="qw482-field-val">\${escapeHtml(d.backgouging)}</span></div>
                        </td>`;

html = html.replace(jointsOldHtml, jointsNewHtml);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html successfully updated with Welding Schematic SVG!');

// 2. Update worker/src/index.js prompt to add capReinforcement and filletSize to WPS_METRICS tag
let worker = fs.readFileSync('worker/src/index.js', 'utf8');

const workerOldMetrics = `"backgouging": "None (or Grinding)",`;
const workerNewMetrics = `"backgouging": "None (or Grinding)",
  "capReinforcement": "1.5 - 2.5 mm (max 3.0 mm per UW-35)",
  "filletSize": "Leg equal to nominal wall (Throat = 0.707 x Leg)",`;

if (worker.includes(workerOldMetrics)) {
    worker = worker.replace(workerOldMetrics, workerNewMetrics);
    fs.writeFileSync('worker/src/index.js', worker, 'utf8');
    console.log('worker/src/index.js updated with capReinforcement and filletSize in WPS_METRICS tag.');
} else {
    console.log('Worker already contains updated metrics or target string not found.');
}
