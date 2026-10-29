// scripts/ingest_enriched_aws_nace_chunks.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

const newChunks = [
  // --- AWS D1.1 ENRICHED CHUNKS ---
  {
    standard_code: 'AWS D1.1',
    standard_name: 'Structural Welding Code — Steel',
    section: 'Clause 6 — Inspection / Table 6.1',
    clause: 'Table 6.1 — Visual Inspection Acceptance Criteria (Statically Loaded)',
    acceptance_limits: 'ACCEPTANCE: Cracks: None permitted. Undercut <= 1 mm (1/32 in) for t < 25 mm, max 1.6 mm (1/16 in) accumulated <= 50 mm in 300 mm. Porosity: None in butt CJP tension welds; sum <= 10 mm in 25 mm for others.',
    rejection_limits: 'REJECTION: Any crack regardless of size. Undercut > 1 mm in primary structural joints (or > 1.6 mm). Any visible piping porosity in CJP groove welds subject to calculated tension stress.',
    qa_docs: 'AWS Form N-1 / Visual Inspection Report (VT)',
    content: `[STANDARD: AWS D1.1] [TITLE: Structural Welding Code — Steel] [SECTION: Clause 6 — Inspection / Table 6.1] [CLAUSE: Table 6.1 — Visual Inspection Acceptance Criteria (Statically Loaded)]

[CLAUSE: Table 6.1 — Visual Inspection Acceptance Criteria (Statically Loaded Connections)]
Visual inspection shall be conducted per AWS D1.1 Clause 6. Acceptance criteria:
1. CRACK PROHIBITION: Any crack shall be unacceptable regardless of size or location.
2. WELD/BASE-METAL FUSION: Thorough fusion shall exist between adjacent layers of weld metal and between weld metal and base metal.
3. CRATER CROSS SECTION: All craters shall be filled to the full cross section of the weld, except on ends of isolated intermittent fillet welds outside of effective length.
4. WELD PROFILES: Weld profiles shall be in accordance with AWS D1.1 Clause 5.24.
5. UNDERCUT:
   - For material thickness < 25 mm (1 in): Undercut shall not exceed 1 mm (1/32 in), except max 1.6 mm (1/16 in) for any accumulated length up to 50 mm (2 in) in any 300 mm (12 in).
   - For material thickness >= 25 mm (1 in): Undercut <= 1.6 mm (1/16 in) for any length.
6. POROSITY:
   - Complete joint penetration (CJP) groove welds in butt joints transverse to calculated tensile stress shall have NO visible piping porosity.
   - For all other groove and fillet welds, the frequency of piping porosity shall not exceed one in each 100 mm (4 in) of weld length and maximum diameter shall not exceed 2.5 mm (3/32 in).
ACCEPTANCE: Cracks: None permitted. Undercut <= 1 mm (1/32 in) for t < 25 mm, max 1.6 mm (1/16 in) accumulated <= 50 mm in 300 mm. Porosity: None in butt CJP tension welds; sum <= 10 mm in 25 mm for others.
REJECTION: Any crack regardless of size. Undercut > 1 mm in primary structural joints (or > 1.6 mm). Any visible piping porosity in CJP groove welds subject to calculated tension stress.`
  },
  {
    standard_code: 'AWS D1.1',
    standard_name: 'Structural Welding Code — Steel',
    section: 'Clause 6 — Inspection / Table 6.1',
    clause: 'Table 6.1 — Visual Inspection Acceptance Criteria (Cyclically Loaded)',
    acceptance_limits: 'ACCEPTANCE: Transverse undercut <= 0.25 mm (0.01 in). Longitudinal undercut <= 0.8 mm (1/32 in). Piping porosity: Max 1 pore <= 2.5 mm in 100 mm length.',
    rejection_limits: 'REJECTION: Any crack. Undercut > 0.25 mm in members subject to cyclic tensile stress. Porosity exceeding 1 pore per 100 mm.',
    qa_docs: 'AWS Cyclically Loaded Inspection Form VT-2',
    content: `[STANDARD: AWS D1.1] [TITLE: Structural Welding Code — Steel] [SECTION: Clause 6 — Inspection / Table 6.1] [CLAUSE: Table 6.1 — Visual Inspection Acceptance Criteria (Cyclically Loaded)]

[CLAUSE: Table 6.1 — Visual Inspection Acceptance Criteria (Cyclically Loaded Connections)]
For structural members subjected to cyclic fatigue and fluctuating tensile stresses:
1. CRACKS: Zero cracks permitted (100% rejection).
2. UNDERCUT IN TRANSVERSE MEMBERS: In primary members subject to calculated tensile stress transverse to weld axis, undercut depth shall not exceed 0.25 mm (0.01 in). For all other members, undercut shall not exceed 0.8 mm (1/32 in).
3. PIPING POROSITY: In CJP butt joints transverse to tension, zero piping porosity permitted. In other welds, piping porosity diameter shall not exceed 2.5 mm (3/32 in) and frequency shall not exceed 1 pore in 100 mm (4 in).
4. REINFORCEMENT: Maximum weld reinforcement shall not exceed 3 mm (1/8 in) for t <= 25 mm, smoothly transitioned without re-entrant notches.
ACCEPTANCE: Transverse undercut <= 0.25 mm (0.01 in). Longitudinal undercut <= 0.8 mm (1/32 in). Piping porosity: Max 1 pore <= 2.5 mm in 100 mm length.
REJECTION: Any crack. Undercut > 0.25 mm in members subject to cyclic tensile stress. Porosity exceeding 1 pore per 100 mm.`
  },
  {
    standard_code: 'AWS D1.1',
    standard_name: 'Structural Welding Code — Steel',
    section: 'Clause 3 — Prequalification / Table 3.3',
    clause: 'Table 3.3 — Prequalified Minimum Preheat and Interpass Temperatures',
    acceptance_limits: 'ACCEPTANCE: Category B steels (A572 Gr 50, A992): t <= 19 mm: 50°F (10°C); 19 mm < t <= 38 mm: 150°F (65°C); 38 mm < t <= 65 mm: 225°F (110°C); t > 65 mm: 300°F (150°C).',
    rejection_limits: 'REJECTION: Welding commenced below minimum preheat temperature. Measurement taken less than 75 mm (3 in) from weld joint in all directions.',
    qa_docs: 'Preheat Verification Log / Tempilstik Audit Form',
    content: `[STANDARD: AWS D1.1] [TITLE: Structural Welding Code — Steel] [SECTION: Clause 3 — Prequalification / Table 3.3] [CLAUSE: Table 3.3 — Prequalified Minimum Preheat and Interpass Temperatures]

[CLAUSE: Table 3.3 — Prequalified Minimum Preheat and Interpass Temperature Table]
Preheat and interpass temperatures shall be maintained throughout the entire welding operation.
STEEL CATEGORY B (ASTM A36 over 25 mm, A572 Grade 50, A992, CSA G40.21 350W):
- Thickness t <= 19 mm (3/4 in): Minimum preheat 50°F (10°C) [32°F / 0°C if ambient > 32°F and low-hydrogen process used].
- Thickness 19 mm < t <= 38 mm (3/4 in to 1.5 in): Minimum preheat 150°F (65°C).
- Thickness 38 mm < t <= 65 mm (1.5 in to 2.5 in): Minimum preheat 225°F (110°C).
- Thickness t > 65 mm (> 2.5 in): Minimum preheat 300°F (150°C).
MEASUREMENT: Preheat temperature must be established throughout thickness and for a distance of at least 75 mm (3 in) or thickness of member (whichever is greater) in all directions from the point of welding.
MAXIMUM INTERPASS: 600°F (315°C) for quenched and tempered or high-strength microalloyed steels.
ACCEPTANCE: Category B steels (A572 Gr 50, A992): t <= 19 mm: 50°F (10°C); 19 mm < t <= 38 mm: 150°F (65°C); 38 mm < t <= 65 mm: 225°F (110°C); t > 65 mm: 300°F (150°C).
REJECTION: Welding commenced below minimum preheat temperature. Measurement taken less than 75 mm (3 in) from weld joint in all directions.`
  },
  {
    standard_code: 'AWS D1.1',
    standard_name: 'Structural Welding Code — Steel',
    section: 'Clause 6 — Inspection / Clause 6.11',
    clause: 'Clause 6.11 & Table 6.2 — Ultrasonic Testing (UT) Acceptance-Rejection Criteria',
    acceptance_limits: 'ACCEPTANCE: Class B, C, D discontinuities within length and spacing limits of Table 6.2. Attenuation factor correctly calculated.',
    rejection_limits: 'REJECTION: Any Class A severity level reflection. Discontinuities in tensile stress regions exceeding allowable length curves.',
    qa_docs: 'AWS UT Examination Calibration & Defect Record Form UT-1',
    content: `[STANDARD: AWS D1.1] [TITLE: Structural Welding Code — Steel] [SECTION: Clause 6 — Inspection / Clause 6.11] [CLAUSE: Clause 6.11 & Table 6.2 — Ultrasonic Testing (UT) Acceptance-Rejection Criteria]

[CLAUSE: Clause 6.11 & Table 6.2 — UT Acceptance Criteria for Statically Loaded Welds]
Weld quality for ultrasonic examination is evaluated by calculating the decibel rating d = a - b - c, where:
- a = transducer decibel gain setting
- b = reference level decibel gain
- c = sound path attenuation factor (2 dB per inch of sound path beyond 1 in)
DISCONTINUITY SEVERITY CLASSES:
- Class A (Large Discontinuity): Strictly UNACCEPTABLE regardless of length. Must be repaired and re-inspected.
- Class B (Medium Discontinuity): Any discontinuity with length > 19 mm (3/4 in) is rejected. Discontinuities separated by less than 2L shall be considered continuous.
- Class C (Small Discontinuity): Maximum allowable length 50 mm (2 in). Must be separated by minimum 2L from other Class C or B indications.
- Class D (Minor Discontinuity): Acceptable without repair provided distance between adjacent indications exceeds 2L.
ACCEPTANCE: Class B, C, D discontinuities within length and spacing limits of Table 6.2. Attenuation factor correctly calculated.
REJECTION: Any Class A severity level reflection. Discontinuities in tensile stress regions exceeding allowable length curves.`
  },

  // --- NACE MR0175 / ISO 15156 ENRICHED CHUNKS ---
  {
    standard_code: 'NACE MR0175 / ISO 15156',
    standard_name: 'Petroleum and Natural Gas Industries — Materials for Use in H2S-Containing Environments',
    section: 'Part 2 — Carbon and Low-Alloy Steels / Clause 7.3 & Annex A',
    clause: 'Part 2 — Clause 7.3 & Annex A.2.1 — Hardness Limits for Welds and Base Materials',
    acceptance_limits: 'ACCEPTANCE: Hardness <= 22 HRC (250 HV10 / 237 HBW) across weld metal, fusion boundary, and Heat-Affected Zone (HAZ).',
    rejection_limits: 'REJECTION: Any single reading > 22 HRC (250 HV10) in HAZ or weld metal. Root pass exceeding 250 HV due to rapid quenching.',
    qa_docs: 'Hardness Survey Traverse Report Form HS-10 (10 kg Vickers)',
    content: `[STANDARD: NACE MR0175 / ISO 15156] [TITLE: Petroleum and Natural Gas Industries — Materials for Use in H2S-Containing Environments] [SECTION: Part 2 — Carbon and Low-Alloy Steels / Clause 7.3 & Annex A] [CLAUSE: Part 2 — Clause 7.3 & Annex A.2.1 — Hardness Limits for Welds and Base Materials]

[CLAUSE: Part 2 — Clause 7.3 & Annex A.2.1 — Hardness Requirements for Carbon and Low-Alloy Steels]
For sour service applications (H2S partial pressure >= 0.05 psi / 0.3 kPa):
1. MAXIMUM HARDNESS CEILING:
   - Base metal, weld metal, and Heat-Affected Zone (HAZ) shall not exceed 22 HRC (Rockwell C).
   - Equivalent Vickers: 250 HV (using 10 kg or 5 kg indentation load, HV10 or HV5 per ISO 6507-1).
   - Equivalent Brinell: 237 HBW (per ASTM E10 / ISO 6506-1).
2. WELDING PROCEDURE HARDNESS SURVEY:
   - Procedure qualification records (PQR) require cross-sectional Vickers hardness surveys (minimum 3 traverses: root, mid-thickness, cap).
   - Indentations must target the fusion boundary, coarse-grain HAZ (CGHAZ within 0.5 mm of fusion line), and fine-grain HAZ.
   - Any single indentation exceeding 250 HV requires weld qualification rejection.
3. MITIGATION FOR HAZ HARDENING:
   - Require elevated preheat (minimum 150°C / 300°F for alloy steels like 4130).
   - Mandatory post-weld heat treatment (PWHT) at 595°C - 650°C (1100°F - 1200°F) to temper residual martensite.
ACCEPTANCE: Hardness <= 22 HRC (250 HV10 / 237 HBW) across weld metal, fusion boundary, and Heat-Affected Zone (HAZ).
REJECTION: Any single reading > 22 HRC (250 HV10) in HAZ or weld metal. Root pass exceeding 250 HV due to rapid quenching.`
  },
  {
    standard_code: 'NACE MR0175 / ISO 15156',
    standard_name: 'Petroleum and Natural Gas Industries — Materials for Use in H2S-Containing Environments',
    section: 'Part 2 — Carbon and Low-Alloy Steels / Annex A.2.1.3',
    clause: 'Part 2 — Annex A.2.1.3 — Post-Weld Heat Treatment (PWHT) and Tempering',
    acceptance_limits: 'ACCEPTANCE: PWHT applied per ASME B31.3 / ASME VIII with minimum hold temperature 595°C (1100°F) for low alloys; verified hardness <= 22 HRC.',
    rejection_limits: 'REJECTION: As-welded condition used for carbon steel with SMYS > 360 MPa (52 ksi) or low-alloy Cr-Mo steels in sour service without documented qualification.',
    qa_docs: 'PWHT Time-Temperature Recorder Chart & Furnace Calibration Certificate',
    content: `[STANDARD: NACE MR0175 / ISO 15156] [TITLE: Petroleum and Natural Gas Industries — Materials for Use in H2S-Containing Environments] [SECTION: Part 2 — Carbon and Low-Alloy Steels / Annex A.2.1.3] [CLAUSE: Part 2 — Annex A.2.1.3 — Post-Weld Heat Treatment (PWHT) and Tempering]

[CLAUSE: Part 2 — Annex A.2.1.3 — PWHT Mitigation for Sulfide Stress Cracking]
Welding introduces high residual tensile stresses and untempered martensitic microstructures susceptible to Sulfide Stress Cracking (SSC).
1. PWHT REQUIREMENTS:
   - Low-alloy steels (including AISI 4130, ASTM A335 P11/P22, 1-1/4Cr-1/2Mo, 2-1/4Cr-1Mo) SHALL receive thermal stress relief / PWHT following all welding operations.
   - Minimum PWHT temperature for 4130 / P-No. 4: 595°C - 650°C (1100°F - 1200°F) for at least 1 hour per 25 mm of thickness (minimum 1 hour hold).
   - Maximum tempering temperature shall remain at least 14°C (25°F) below the original manufacturing tempering temperature of the base forging or pipe.
2. AS-WELDED LIMITATION:
   - As-welded carbon steels are only permitted if base metal SMYS <= 360 MPa (52 ksi), maximum carbon equivalent CE(IIW) <= 0.43, and welding procedure hardness survey verifies all HAZ locations <= 250 HV10.
ACCEPTANCE: PWHT applied per ASME B31.3 / ASME VIII with minimum hold temperature 595°C (1100°F) for low alloys; verified hardness <= 22 HRC.
REJECTION: As-welded condition used for carbon steel with SMYS > 360 MPa (52 ksi) or low-alloy Cr-Mo steels in sour service without documented qualification.`
  },
  {
    standard_code: 'NACE MR0175 / ISO 15156',
    standard_name: 'Petroleum and Natural Gas Industries — Materials for Use in H2S-Containing Environments',
    section: 'Part 3 — Corrosion-Resistant Alloys (CRAs) / Table A.2',
    clause: 'Part 3 — Clause A.3 & Table A.2 — Duplex and Austenitic Stainless Steels in Sour Service',
    acceptance_limits: 'ACCEPTANCE: 22Cr Duplex: Hardness <= 28 HRC (270 HV10); Ferrite 35% - 65% in base metal, 30% - 70% in weld metal. Super Duplex (25Cr): Hardness <= 32 HRC (330 HV10).',
    rejection_limits: 'REJECTION: Hardness exceeding limits. Ferrite content < 30% or > 70% in weld deposit. Detection of intermetallic sigma (σ) or chi (χ) phases.',
    qa_docs: 'Ferrite Scope Calibration Record / ASTM E562 Point Count Metallography',
    content: `[STANDARD: NACE MR0175 / ISO 15156] [TITLE: Petroleum and Natural Gas Industries — Materials for Use in H2S-Containing Environments] [SECTION: Part 3 — Corrosion-Resistant Alloys (CRAs) / Table A.2] [CLAUSE: Part 3 — Clause A.3 & Table A.2 — Duplex and Austenitic Stainless Steels in Sour Service]

[CLAUSE: Part 3 — Clause A.3 & Table A.2 — Requirements for Duplex Stainless Steels]
For duplex and super duplex stainless steels deployed in sour service:
1. HARDNESS THRESHOLDS:
   - Standard 22Cr Duplex (UNS S31803 / S32205): Maximum allowable hardness is 28 HRC (270 HV10).
   - 25Cr Super Duplex (UNS S32750 / S32760): Maximum allowable hardness is 32 HRC (330 HV10).
2. PHASE BALANCE & FERRITE CONTENT:
   - Ferrite volume fraction shall be measured per ASTM E562 or magnetic gauge (Feritscope) per ISO 8249.
   - Base metal ferrite: 35% to 65%.
   - As-welded weld metal and HAZ ferrite: 30% to 70%. Excessive austenite (> 70%) causes yield failure; excessive ferrite (> 70%) precipitates brittle chromium nitrides.
3. PRECIPITATION INTEGRITY:
   - Weldments shall be free of continuous intermetallic phases (sigma phase, chi phase) when examined at 400x magnification etched with 40% KOH.
ACCEPTANCE: 22Cr Duplex: Hardness <= 28 HRC (270 HV10); Ferrite 35% - 65% in base metal, 30% - 70% in weld metal. Super Duplex (25Cr): Hardness <= 32 HRC (330 HV10).
REJECTION: Hardness exceeding limits. Ferrite content < 30% or > 70% in weld deposit. Detection of intermetallic sigma (σ) or chi (χ) phases.`
  }
];

function escapeSql(str) {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

const sqlLines = newChunks.map(ch => {
  return `INSERT INTO standards_chunks (standard_code, standard_name, section, clause, acceptance_limits, rejection_limits, qa_docs, content, scope, organization) VALUES (${escapeSql(ch.standard_code)}, ${escapeSql(ch.standard_name)}, ${escapeSql(ch.section)}, ${escapeSql(ch.clause)}, ${escapeSql(ch.acceptance_limits)}, ${escapeSql(ch.rejection_limits)}, ${escapeSql(ch.qa_docs)}, ${escapeSql(ch.content)}, 'global', 'CANONICAL_ENRICHMENT');`;
});

const tempSqlFile = path.join(workerDir, 'temp_enrichment.sql');
fs.writeFileSync(tempSqlFile, sqlLines.join('\n\n'), 'utf8');

console.log(`Wrote ${newChunks.length} INSERT statements to ${tempSqlFile}. Executing via D1 --file...`);

try {
  const res = execSync(`npx.cmd wrangler d1 execute inspection-db --remote --file=temp_enrichment.sql`, {
    cwd: workerDir,
    encoding: 'utf8'
  });
  console.log(res);
} finally {
  if (fs.existsSync(tempSqlFile)) {
    fs.unlinkSync(tempSqlFile);
  }
}

console.log('--- Step 3: Verifying AWS D1.1 and NACE MR0175 Chunk Counts ---');
const check = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT standard_code, count(id) as total, count(acceptance_limits) as with_acc FROM standards_chunks WHERE standard_code IN (\'AWS D1.1\', \'NACE MR0175 / ISO 15156\') GROUP BY standard_code"', {
  cwd: workerDir,
  encoding: 'utf8'
});
console.log(check);
