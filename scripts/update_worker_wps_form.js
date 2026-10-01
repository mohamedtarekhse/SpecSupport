const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let workerJs = fs.readFileSync(workerPath, 'utf8');

// 1. Broaden isWps, hasBaseMetal, and hasThickness detectors
const oldIsWpsRegex = /const isWps = \/\(\?:wps\\b\|welding procedure\|pqr\\b\|welding spec\|welding procedure specification\)\/i\.test\(qClean\);/;

const newIsWpsSnippet = `const isWps = /(?:wps\\b|welding procedure|pqr\\b|welding spec|welding procedure specification|asme\\s*(?:viii|8|ix|9|xi|11)|qw-?482|pressure vessel weld|pipe weld)/i.test(qClean);`;

if (oldIsWpsRegex.test(workerJs)) {
  workerJs = workerJs.replace(oldIsWpsRegex, newIsWpsSnippet);
  console.log('Updated isWps detector in worker.');
}

const oldHasBaseMetalRegex = /const hasBaseMetal = \/\(\?:a106\|a333\|a53\|api 5l\|316l\?\|304l\?\|p-no\|p1\|p8\|x52\|x60\|x65\|4130\|carbon steel\|stainless\)\/i\.test\(qClean\);/;

const newHasBaseMetalSnippet = `const hasBaseMetal = /(?:a106|a333|a53|api 5l|sa-?516|sa516|sa-?537|sa-?106|sa106|sa-?333|sa333|sa-?240|sa240|sa-?312|sa312|316l?|304l?|p-?no|p1|p8|p3|p4|p5a|x52|x60|x65|4130|carbon steel|stainless|pressure vessel)/i.test(qClean);`;

if (oldHasBaseMetalRegex.test(workerJs)) {
  workerJs = workerJs.replace(oldHasBaseMetalRegex, newHasBaseMetalSnippet);
  console.log('Updated hasBaseMetal detector in worker.');
}

const oldHasThicknessRegex = /const hasThickness = \/\(\?:sch\|schedule\|wall\|thickness\|\\bmm\\b\|\\binch\\b\|\\bthk\\b\|xxs\|std\)\/i\.test\(qClean\);/;

const newHasThicknessSnippet = `const hasThickness = /(?:sch|schedule|wall|thickness|\\bmm\\b|\\binch\\b|\\bthk\\b|xxs|std|gauge|gage|\\bplate\\b)/i.test(qClean);`;

if (oldHasThicknessRegex.test(workerJs)) {
  workerJs = workerJs.replace(oldHasThicknessRegex, newHasThicknessSnippet);
  console.log('Updated hasThickness detector in worker.');
}

// 2. Enhance the Deterministic ASME Form QW-482 Directive to output <!--WPS_METRICS: {...}-->
const oldQw482Directive = `Generate a complete, audit-ready, field-executable Welding Procedure Specification formatted strictly according to ASME Section IX Form QW-482:
1. HEADER & SCOPE: WPS Number, Revision, Supporting PQR, Process (GTAW root + SMAW fill/cap).
2. JOINTS (QW-402): Single V-Groove, Bevel Angle (60°-75°), Root Face (1.5-2.5 mm), Root Gap (2.0-3.2 mm).
3. BASE METALS (QW-403): Material Specification, P-No & Group No, Qualified Thickness Range per ASME IX QW-451.1.
4. FILLER METALS (QW-404): SFA Spec, AWS Classification (ER70S-6 / E7018-1 H4R), F-No & A-No.
5. POSITION (QW-405): 6G or All Positions, Progression Uphill.
6. PREHEAT (QW-406): ASME B31.3 Table 330.1.1 limits.
7. PWHT (QW-407): ASME B31.3 Table 331.1.1 rules (None if <=19.05mm; 595°C-650°C if >19.05mm).
8. SHIELDING GAS (QW-408): 100% Argon, Flow Rate 10-15 L/min.
9. ELECTRICAL PARAMETERS (QW-409): Table of passes, amps, volts, travel speed, max heat input.
10. NDE & INSPECTION HOLD POINTS: 100% Visual (AWS B1.11 / B31.3) + 100% RT (ASME V Art. 2 / B31.3 Table 341.3.2).
CRITICAL RULE: Apply Global International Standards (ASME/AWS/API). Do NOT impose proprietary operator rules unless requested.`;

const newQw482Directive = `Generate a complete, audit-ready, field-executable Welding Procedure Specification formatted strictly according to ASME Boiler and Pressure Vessel Code Section IX Form QW-482 (Applicable to ASME Section VIII Div 1/2 Pressure Vessels, ASME B31.3 Piping, and ASME Section XI Inservice Repairs):
1. HEADER & IDENTIFICATION: Company Name (SpecSupport Certified Engineering), WPS Number (e.g. WPS-ASME-VIII-2026-01), Revision (Rev. 0), Date, Supporting PQR Number(s), Welding Process(es) (e.g. GTAW + SMAW), Type(s) (Manual / Semi-Automatic).
2. JOINTS (QW-402): Joint Design (Single V-Groove / Fillet), Backing (With/Without), Backing Material, Root Opening (1.5-3.2 mm), Root Face (1.5-2.5 mm), Groove Angle (60°-75°), Backgouging Method (Grinding / Air Carbon Arc).
3. BASE METALS (QW-403): Material Specification (e.g. SA-516 Gr 70 for ASME VIII or SA-106 Gr B / SA-333 Gr 6), P-No. & Group No. to P-No. & Group No., Thickness Range Qualified per QW-451.1 (Groove & Fillet), Pipe Diameter Range.
4. FILLER METALS (QW-404): Process, SFA Specification (e.g. SFA 5.18 / SFA 5.1), AWS Classification (ER70S-6 / E7018-1 H4R), F-No. & A-No., Filler Sizes (2.4 mm, 3.2 mm, 4.0 mm), Deposited Weld Metal Thickness range, Consumable Insert.
5. POSITIONS (QW-405): Position(s) of Groove (1G to 6G / All Positions), Progression (Uphill), Fillet Positions.
6. PREHEAT (QW-406): Preheat Temp Min (°C / °F) per ASME VIII / B31.3 Table 330.1.1, Interpass Temp Max, Preheat Maintenance.
7. POSTWELD HEAT TREATMENT (QW-407): Temperature Range per ASME VIII UCS-56 or B31.3 Table 331.1.1 (e.g. 595°C-650°C if thickness > 19 mm, or "None required for thickness <= 19 mm"), Holding Time (1 hr/inch).
8. SHIELDING GAS (QW-408): Shielding Gas (100% Argon / 80% Ar + 20% CO2), Flow Rate (10-15 L/min), Backing Gas (99.99% Ar or None).
9. ELECTRICAL SCHEDULE (QW-409): Complete markdown table with Layers/Passes (Root, Hot Pass, Fill, Cap), Process, Filler Metal Class & Dia, Current/Polarity (DCEN/DCEP), Amperage Range, Voltage Range, Travel Speed Range, Maximum Heat Input (kJ/mm).
10. TECHNIQUE (QW-410): String or Weave Bead, Orifice/Gas Cup Size, Initial & Interpass Cleaning (Wire brush & grind), Method of Back Gouging, Peening, Multiple or Single Pass per side.
11. NDE & HOLD POINTS: 100% Visual (AWS B1.11 / ASME VIII UW-35) + 100% RT (ASME V Art. 2 / ASME VIII UW-51 / B31.3 Table 341.3.2) or UT (ASME V Art. 4).
12. MANDATORY METRICS TAG: At the very end of your response, output a valid machine-readable JSON block enclosed inside HTML comment tags:
<!--WPS_METRICS: {
  "wpsNumber": "WPS-ASME-VIII-2026-01",
  "revision": "Rev. 0",
  "supportingPqr": "PQR-ASME-2026-01",
  "process": "GTAW (Root) + SMAW (Fill/Cap)",
  "type": "Manual",
  "governingCode": "ASME Section VIII Div 1 & Section IX",
  "baseMetalSpec": "SA-516 Gr. 70 (or ASTM A106 Gr. B)",
  "pNoFrom": "P-No. 1, Group 1/2",
  "pNoTo": "P-No. 1, Group 1/2",
  "thicknessRangeGroove": "1.5 mm to 38.1 mm (0.062 to 1.5 in)",
  "thicknessRangeFillet": "All Thicknesses",
  "diameterRange": "All Diameters",
  "jointDesign": "Single V-Groove",
  "backing": "No (Open Root)",
  "rootOpening": "2.0 - 3.2 mm (3/32 - 1/8 in)",
  "rootFace": "1.5 - 2.5 mm (1/16 - 3/32 in)",
  "grooveAngle": "60° - 75° Included",
  "backgouging": "None (or Grinding)",
  "fillerProcess1": "GTAW",
  "sfaSpec1": "SFA 5.18",
  "awsClass1": "ER70S-6",
  "fNo1": "F-6",
  "aNo1": "A-1",
  "fillerSize1": "2.4 mm (3/32 in)",
  "depositThk1": "3.5 mm max",
  "fillerProcess2": "SMAW",
  "sfaSpec2": "SFA 5.1",
  "awsClass2": "E7018-1 H4R",
  "fNo2": "F-4",
  "aNo2": "A-1",
  "fillerSize2": "3.2 mm & 4.0 mm",
  "depositThk2": "34.6 mm max",
  "positionGroove": "6G (All Positions)",
  "progression": "Uphill",
  "preheatMin": "10°C (50°F) or 95°C (200°F)",
  "interpassMax": "230°C (450°F)",
  "preheatMaint": "Continuous until welding completed",
  "pwhtTemp": "595°C - 650°C (1100°F - 1200°F) if required",
  "pwhtTime": "1 hr per 25 mm (1 in)",
  "shieldingGas": "Argon 99.99%",
  "gasFlow": "10 - 15 L/min (20 - 30 CFH)",
  "backingGas": "None",
  "currentPolarity": "GTAW: DCEN / SMAW: DCEP",
  "technique": "Stringer or Weave Bead (max 3x core dia)",
  "cleaning": "Wire brushing and grinding",
  "multiplePass": "Multiple passes per side",
  "ndeRequirements": "100% Visual (AWS B1.11 / UW-35) + 100% RT (ASME V Art. 2 / UW-51)"
}-->`;

if (workerJs.includes(oldQw482Directive)) {
  workerJs = workerJs.replace(oldQw482Directive, newQw482Directive);
  console.log('Updated Deterministic ASME Form QW-482 Directive in worker.');
}

fs.writeFileSync(workerPath, workerJs, 'utf8');
console.log('Successfully updated worker/src/index.js');
