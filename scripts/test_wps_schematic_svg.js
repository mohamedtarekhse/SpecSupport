/**
 * Prototype and test the Welding Schematic SVG Generator
 */
function generateWeldingJointSvg(d) {
    const isFillet = (d.jointDesign && d.jointDesign.toLowerCase().includes('fillet')) || 
                     (d.thicknessRangeFillet && d.thicknessRangeFillet.toLowerCase().includes('only'));

    const bevelAngle = d.grooveAngle || "60° - 75°";
    const rootOpening = d.rootOpening || "2.0 - 3.2 mm";
    const rootFace = d.rootFace || "1.5 - 2.5 mm";
    const thickness = d.nominalThickness || (d.thicknessRangeGroove ? d.thicknessRangeGroove.split(' ')[0] + ' mm' : "12.7 mm");
    const capReinf = d.capReinforcement || "1.5 - 3.0 mm (max)";
    const filletLeg = d.filletSize || "8.0 - 10.0 mm";

    if (isFillet) {
        return `
        <svg viewBox="0 0 460 210" width="100%" height="200" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-family:'Segoe UI', Calibri, sans-serif;">
            <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0070F2"/>
                </marker>
                <marker id="arrow-dark" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#334155"/>
                </marker>
                <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" stroke-width="1.2" />
                </pattern>
            </defs>

            <!-- Base Plate (Horizontal) -->
            <rect x="70" y="140" width="310" height="40" fill="url(#hatch)" stroke="#334155" stroke-width="2"/>
            <rect x="70" y="140" width="310" height="40" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="2"/>

            <!-- Upright Member (Vertical T-Joint) -->
            <rect x="200" y="30" width="45" height="110" fill="url(#hatch)" stroke="#334155" stroke-width="2"/>
            <rect x="200" y="30" width="45" height="110" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="2"/>

            <!-- Fillet Weld Bead Left (Double/Single Fillet) -->
            <path d="M 170 140 Q 192 132 200 110 L 200 140 Z" fill="#93c5fd" stroke="#0070F2" stroke-width="1.8"/>
            <!-- Fillet Weld Bead Right -->
            <path d="M 245 110 Q 253 132 275 140 L 245 140 Z" fill="#93c5fd" stroke="#0070F2" stroke-width="1.8"/>

            <!-- Dimension: Vertical Plate Thickness -->
            <line x1="200" y1="20" x2="245" y2="20" stroke="#0070F2" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="222" y="14" fill="#0070F2" font-size="10" font-weight="700" text-anchor="middle">Thickness (t): ${thickness}</text>

            <!-- Dimension: Fillet Leg Length (Vertical) -->
            <line x1="160" y1="110" x2="160" y2="140" stroke="#0070F2" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="152" y="127" fill="#0070F2" font-size="9.5" font-weight="700" text-anchor="end">Leg (z): ${filletLeg}</text>

            <!-- Dimension: Fillet Leg Length (Horizontal) -->
            <line x1="245" y1="152" x2="275" y2="152" stroke="#0070F2" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
            <text x="260" y="166" fill="#0070F2" font-size="9.5" font-weight="700" text-anchor="middle">Fillet Leg: ${filletLeg}</text>

            <!-- Convexity / Throat check -->
            <path d="M 245 110 L 275 140" stroke="#64748b" stroke-dasharray="2 2" stroke-width="1"/>
            <line x1="285" y1="120" x2="260" y2="125" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow-dark)"/>
            <text x="290" y="122" fill="#0f172a" font-size="9" font-weight="700">Throat (a) &le; 0.707 x Leg</text>

            <!-- Title & Code Callout -->
            <text x="20" y="24" fill="#0f172a" font-size="10" font-weight="800">QW-402 T-JOINT FILLET DETAIL</text>
            <text x="20" y="38" fill="#64748b" font-size="8.5">ASME Section IX / AWS B1.11</text>
        </svg>
        `;
    }

    // Default: Single V-Groove Butt Weld schematic with Bevel, Root Face, Root Opening, Cap, and Thickness
    return `
    <svg viewBox="0 0 520 215" width="100%" height="205" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-family:'Segoe UI', Calibri, sans-serif;">
        <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0070F2"/>
            </marker>
            <marker id="arrow-dark" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#334155"/>
            </marker>
            <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#cbd5e1" stroke-width="1.2" />
            </pattern>
        </defs>

        <!-- Plate 1 (Left Plate) -->
        <polygon points="50,60 210,60 230,120 230,140 50,140" fill="url(#hatch)" stroke="#334155" stroke-width="2"/>
        <polygon points="50,60 210,60 230,120 230,140 50,140" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="2"/>

        <!-- Plate 2 (Right Plate) -->
        <polygon points="270,120 290,60 450,60 450,140 270,140" fill="url(#hatch)" stroke="#334155" stroke-width="2"/>
        <polygon points="270,120 290,60 450,60 450,140 270,140" fill="#f1f5f9" fill-opacity="0.6" stroke="#334155" stroke-width="2"/>

        <!-- Deposited Weld Beads (Root, Fill, Cap) -->
        <!-- Root Bead -->
        <path d="M 230 140 Q 250 148 270 140 L 268 122 Q 250 126 232 122 Z" fill="#38bdf8" stroke="#0284c7" stroke-width="1.2"/>
        <!-- Fill Layers -->
        <path d="M 232 122 Q 250 126 268 122 L 285 75 Q 250 78 215 75 Z" fill="#93c5fd" stroke="#0070F2" stroke-width="1.2"/>
        <!-- Crown / Cap Reinforcement -->
        <path d="M 205 60 Q 250 42 295 60 Q 250 56 205 60 Z" fill="#60a5fa" stroke="#1d4ed8" stroke-width="1.5"/>

        <!-- DIMENSION: Base Metal Nominal Thickness (t) -->
        <line x1="38" y1="60" x2="38" y2="140" stroke="#0070F2" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
        <text x="32" y="104" fill="#0070F2" font-size="9.5" font-weight="700" text-anchor="end">Wall (t): ${thickness}</text>

        <!-- DIMENSION: Bevel Angle / Included Angle (QW-402) -->
        <path d="M 224 80 Q 250 88 276 80" fill="none" stroke="#dc2626" stroke-width="1.4" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
        <text x="250" y="102" fill="#dc2626" font-size="10" font-weight="700" text-anchor="middle">Bevel: ${bevelAngle}</text>

        <!-- DIMENSION: Root Opening / Gap (R) -->
        <line x1="230" y1="152" x2="270" y2="152" stroke="#0070F2" stroke-width="1.5" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
        <text x="250" y="166" fill="#0070F2" font-size="9.5" font-weight="700" text-anchor="middle">Root Gap (R): ${rootOpening}</text>

        <!-- DIMENSION: Root Face / Land (f) -->
        <line x1="282" y1="120" x2="282" y2="140" stroke="#0070F2" stroke-width="1.4" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
        <text x="290" y="133" fill="#0070F2" font-size="9" font-weight="700">Root Land (f): ${rootFace}</text>

        <!-- DIMENSION: Weld Cap / Crown Reinforcement -->
        <line x1="305" y1="44" x2="305" y2="60" stroke="#1d4ed8" stroke-width="1.4" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
        <text x="314" y="54" fill="#1d4ed8" font-size="9" font-weight="700">Cap Reinforcement: ${capReinf}</text>

        <!-- Root Penetration & Undercut Check Callouts -->
        <line x1="250" y1="146" x2="250" y2="185" stroke="#64748b" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="250" y="196" fill="#475569" font-size="8.5" text-anchor="middle">Root Penetration (Flush to +1.5 mm)</text>

        <!-- Title / Specification Tag -->
        <text x="20" y="24" fill="#0f172a" font-size="10" font-weight="800">QW-402 JOINT SKETCH & WELD PASS DESIGN</text>
        <text x="20" y="38" fill="#64748b" font-size="8.5">ASME Boiler & Pressure Vessel Code Section IX • Form QW-482</text>
    </svg>
    `;
}

console.log(generateWeldingJointSvg({
    jointDesign: "Single V-Groove",
    grooveAngle: "60° - 75°",
    rootOpening: "2.0 - 3.2 mm",
    rootFace: "1.5 - 2.5 mm",
    thicknessRangeGroove: "12.7 mm (1/2 in)",
    capReinforcement: "1.5 - 2.5 mm",
    filletSize: "8.0 mm"
}));
