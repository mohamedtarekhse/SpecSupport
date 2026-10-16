const fs = require('fs');
const path = require('path');

const ixPath = path.join(__dirname, '..', 'standards', 'ASME_IX_WPS_PQR.txt');
let ixContent = fs.readFileSync(ixPath, 'utf8');

const qw422 = `
[CLAUSE: QW-422 — P-Number and Group Number Base Metal Classification]
Grouping of base metals for qualification per ASME Section IX Table QW-422:
- SA-516 Grade 70 (Carbon Steel Plate for Moderate and Lower-Temperature Service):
  * Base Metal: Carbon Steel Plate
  * Specification: SA-516
  * Grade: 70
  * UNS Number: K02700
  * P-Number: P-No. 1
  * Group Number: Group 2
  * Minimum Specified Tensile Strength: 70 ksi (485 MPa)
  * Nominal Composition: Carbon-Manganese-Silicon
- SA-516 Grade 60: P-No. 1, Group 1 (Tensile 60 ksi / 415 MPa).
- SA-106 Grade B (Seamless Carbon Steel Pipe for High-Temp Service): P-No. 1, Group 1.
- SA-333 Grade 6 (Seamless/Welded Steel Pipe for Low-Temp Service): P-No. 1, Group 1.
- SA-387 Grade 11 Class 2 (Low Alloy Cr-Mo Steel): P-No. 4, Group 1.
- SA-240 Type 304 / 316 (Austenitic Stainless Steel): P-No. 8, Group 1.
ACCEPTANCE: Base metal P-No. 1 Group 2 certified on Mill Test Report (MTR / EN 10204 3.1) matching WPS and PQR qualification range.
REJECTION: Base metal P-Number or Group Number mismatch between production steel and qualified WPS.
---
`;

if (!ixContent.includes('QW-422')) {
  fs.writeFileSync(ixPath, ixContent.trim() + '\n\n' + qw422.trim() + '\n', 'utf8');
  console.log('Added QW-422 to ASME_IX_WPS_PQR.txt');
}

const vtPath = path.join(__dirname, '..', 'standards', 'ASME_V_Article9_VT.txt');
const vtContent = `[STANDARD: ASME V]
[TITLE: ASME Boiler and Pressure Vessel Code Section V — Nondestructive Examination]
[EDITION: 2023]
[ARTICLE: 9 — Visual Examination]

[CLAUSE: T-950 — Visual Examination Technique and Lighting Requirements]
Visual examination (VT) shall be conducted in accordance with a written procedure. The lighting and viewing requirements:
- Minimum Illumination: The minimum light intensity at the examination surface shall be 1000 lux (100 foot-candles / 100 fc) for direct visual examination.
- Verification: Light intensity must be verified using a calibrated light meter or certified lux meter prior to examination.
- Viewing Distance & Angle: The inspector's eye shall be within 600 mm (24 in) of the surface to be examined, and at an angle not less than 30 degrees to the examination surface.
- Vision Requirements: Visual examination personnel shall have annual Jaeger J-1 or J-2 near-distance vision acuity and color contrast differentiation.
- Remote Visual Examination (RVI): When direct access is restricted, borescopes, videoscopes, or mirrors may be utilized provided resolution equivalent to direct examination is demonstrated.
ACCEPTANCE: Surface illumination >= 1000 lux (100 foot-candles) verified with calibrated lux meter; eye distance <= 600 mm (24 in) at angle >= 30 degrees.
REJECTION: Surface illumination < 1000 lux (100 fc), unverified lighting, or viewing angle < 30 degrees renders examination invalid.
---
`;

if (!fs.existsSync(vtPath)) {
  fs.writeFileSync(vtPath, vtContent, 'utf8');
  console.log('Created ASME_V_Article9_VT.txt');
}
