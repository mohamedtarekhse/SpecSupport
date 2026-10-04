const fs = require('fs');
const path = require('path');

const b313Path = path.join(__dirname, '..', 'standards', 'ASME_B31.3_Weld_Acceptance.txt');
const asmeIxPath = path.join(__dirname, '..', 'standards', 'ASME_IX_WPS_PQR.txt');

console.log('--- Enriching ASME B31.3 with Table 330.1.1 & Table 331.1.1 ---');
let b313 = fs.readFileSync(b313Path, 'utf8');

const b313Additions = `
[CLAUSE: Table 330.1.1 — Preheat Temperature Requirements]
Minimum preheat temperatures for welding piping components:
- P-No. 1 (Carbon Steels: ASTM A106 Gr B, A53, API 5L):
  * For nominal wall thickness ≤ 25 mm (1.0 in) and tensile strength ≤ 490 MPa: 10°C (50°F) minimum.
  * For nominal wall thickness > 25 mm (1.0 in) or carbon equivalent > 0.43%: 95°C (200°F) minimum preheat.
- P-No. 3, 4 (Low alloy Cr-Mo steels): 150°C to 175°C (300°F to 350°F) minimum preheat.
- Maximum interpass temperature for carbon steel: 230°C (450°F) to preserve HAZ toughness.
ACCEPTANCE: Preheat temperature measured with contact pyrometer or Tempilstik within 75 mm (3 in) of joint prior to welding.
REJECTION: Welding commenced below specified minimum preheat or exceeding maximum interpass temperature.
---

[CLAUSE: Table 331.1.1 — Postweld Heat Treatment (PWHT) Requirements]
Mandatory postweld heat treatment conditions and holding requirements:
- P-No. 1 Base Metals (Carbon Steel Piping):
  * PWHT is mandatory for nominal wall thickness exceeding 19.05 mm (0.75 in / 3/4 in).
  * PWHT holding temperature range: 595°C to 650°C (1100°F to 1200°F).
  * Holding time: 1 hour per 25 mm (1 in) of thickness, minimum hold time 15 minutes.
  * Heating and cooling rates above 315°C (600°F): maximum 335°C/hr divided by thickness in inches.
- PWHT Exemption: P-No. 1 piping with wall thickness ≤ 19.05 mm (0.75 in) is exempt from PWHT provided minimum preheat per Table 330.1.1 is applied.
ACCEPTANCE: Calibrated chart recorder showing continuous temperature log within 595°C-650°C for full required holding duration.
REJECTION: Incomplete holding time, temperature exceeding 650°C, or failure to perform PWHT on thickness > 19.05 mm.
---
`;

if (!b313.includes('Table 330.1.1')) {
  b313 += b313Additions;
  fs.writeFileSync(b313Path, b313, 'utf8');
  console.log('Appended Table 330.1.1 and Table 331.1.1 to ASME B31.3.');
}

console.log('--- Enriching ASME Section IX with QW-432, QW-442 & QW-461.9 ---');
let asmeIx = fs.readFileSync(asmeIxPath, 'utf8');

const asmeIxAdditions = `
[CLAUSE: QW-432 — F-Number Assignment for Welding Electrodes]
Grouping of electrodes and welding rods for procedure and performance qualification:
- F-No. 1: Heavy rutile / iron powder carbon steel electrodes (EXX20, EXX24, EXX27, EXX28).
- F-No. 2: Rutile flux carbon steel electrodes (EXX12, EXX13, EXX14).
- F-No. 3: Cellulosic deep-penetration carbon steel electrodes (EXX10, EXX11 - e.g. E6010, E7010).
- F-No. 4: Basic low-hydrogen carbon steel electrodes (EXX15, EXX16, EXX18 - e.g. E7018, E7018-1 H4R).
- F-No. 5: Austenitic stainless steel covered electrodes (E308, E316, E309).
- F-No. 6: Solid and composite bare filler wire and rods for GTAW, GMAW, SAW (ER70S-6, ER80S, ER316L per SFA 5.18 / SFA 5.9).
ACCEPTANCE: Qualification with F-No. 4 electrode qualifies all lower F-Numbers (F-1, F-2, F-3) for welder performance.
REJECTION: Using higher F-Number electrode in production without procedure qualification.
---

[CLAUSE: QW-442 — A-Number Weld Metal Chemical Analysis]
Classification of ferrous weld metal analysis:
- A-No. 1: Mild carbon steel weld deposit (Carbon ≤ 0.15%, Manganese ≤ 1.60%, Silicon ≤ 1.00%).
  * Deposited by ER70S-6 (GTAW) and E7018-1 H4R (SMAW).
- A-No. 2: Carbon-Molybdenum weld metal (Mo 0.40% - 0.65%).
- A-No. 8: Chromium-Nickel austenitic stainless weld deposit (Type 304, 316).
ACCEPTANCE: Weld metal chemical composition verifies designated A-Number group.
---

[CLAUSE: QW-461.9 — Performance Qualification Position Limitations]
Welder qualification positions and qualified production ranges:
- Plate Qualification:
  * 1G: Qualifies Flat (1G) only.
  * 2G: Qualifies Flat (1G) and Horizontal (2G).
  * 3G: Qualifies Flat (1G) and Vertical (3G).
  * 4G: Qualifies Flat (1G) and Overhead (4G).
  * 3G + 4G test: Qualifies all positions for plate and large diameter pipe.
- Pipe Qualification:
  * 1G Pipe (Rotated): Qualifies 1G Flat.
  * 2G Pipe (Fixed Vertical): Qualifies 1G Flat and 2G Horizontal.
  * 5G Pipe (Fixed Horizontal): Qualifies 1G Flat, 3G Vertical, 4G Overhead, and 5G Fixed.
  * 6G Pipe (Fixed 45° Inclined): Qualifies ALL positions (1G, 2G, 3G, 4G, 5G, 6G) for both pipe and plate groove welds, and all fillet welds.
ACCEPTANCE: Welder performance qualification on 6G pipe certifies welder for all positions across all production configurations.
REJECTION: Welder executing out-of-position weld without required position qualification.
---
`;

if (!asmeIx.includes('QW-432')) {
  asmeIx += asmeIxAdditions;
  fs.writeFileSync(asmeIxPath, asmeIx, 'utf8');
  console.log('Appended QW-432, QW-442, and QW-461.9 to ASME Section IX.');
}

console.log('Standards enrichment complete.');
