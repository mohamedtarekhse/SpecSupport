// worker/src/code_calculator.js
// Evidence-Locked Answer Engine (ELAE) — Code Calculator Module (Dose-Calculator Pattern)
// Pure deterministic static computation. NO LLM. Zero hallucination.

// 1. Standard Pipe Dimensions (ASME B36.10M / B36.19M)
const PIPE_DIMENSIONS = {
  "1/8": { od_mm: 10.3, od_in: 0.405, sch: { "40": 1.73, "80": 2.41, "std": 1.73, "xs": 2.41 } },
  "1/4": { od_mm: 13.7, od_in: 0.540, sch: { "40": 2.24, "80": 3.02, "std": 2.24, "xs": 3.02 } },
  "3/8": { od_mm: 17.1, od_in: 0.675, sch: { "40": 2.31, "80": 3.20, "std": 2.31, "xs": 3.20 } },
  "1/2": { od_mm: 21.3, od_in: 0.840, sch: { "40": 2.77, "80": 3.73, "160": 4.78, "xxs": 7.47, "std": 2.77, "xs": 3.73 } },
  "3/4": { od_mm: 26.7, od_in: 1.050, sch: { "40": 2.87, "80": 3.91, "160": 5.56, "xxs": 7.82, "std": 2.87, "xs": 3.91 } },
  "1": { od_mm: 33.4, od_in: 1.315, sch: { "40": 3.38, "80": 4.55, "160": 6.35, "xxs": 9.09, "std": 3.38, "xs": 4.55 } },
  "1-1/4": { od_mm: 42.2, od_in: 1.660, sch: { "40": 3.56, "80": 4.85, "160": 6.35, "xxs": 9.70, "std": 3.56, "xs": 4.85 } },
  "1.25": { od_mm: 42.2, od_in: 1.660, sch: { "40": 3.56, "80": 4.85, "160": 6.35, "xxs": 9.70, "std": 3.56, "xs": 4.85 } },
  "1-1/2": { od_mm: 48.3, od_in: 1.900, sch: { "40": 3.68, "80": 5.08, "160": 7.14, "xxs": 10.15, "std": 3.68, "xs": 5.08 } },
  "1.5": { od_mm: 48.3, od_in: 1.900, sch: { "40": 3.68, "80": 5.08, "160": 7.14, "xxs": 10.15, "std": 3.68, "xs": 5.08 } },
  "2": { od_mm: 60.3, od_in: 2.375, sch: { "40": 3.91, "80": 5.54, "160": 8.74, "xxs": 11.07, "std": 3.91, "xs": 5.54 } },
  "2-1/2": { od_mm: 73.0, od_in: 2.875, sch: { "40": 5.16, "80": 7.01, "160": 9.53, "xxs": 14.02, "std": 5.16, "xs": 7.01 } },
  "2.5": { od_mm: 73.0, od_in: 2.875, sch: { "40": 5.16, "80": 7.01, "160": 9.53, "xxs": 14.02, "std": 5.16, "xs": 7.01 } },
  "3": { od_mm: 88.9, od_in: 3.500, sch: { "40": 5.49, "80": 7.62, "160": 11.13, "xxs": 15.24, "std": 5.49, "xs": 7.62 } },
  "3-1/2": { od_mm: 101.6, od_in: 4.000, sch: { "40": 5.74, "80": 8.08, "std": 5.74, "xs": 8.08 } },
  "3.5": { od_mm: 101.6, od_in: 4.000, sch: { "40": 5.74, "80": 8.08, "std": 5.74, "xs": 8.08 } },
  "4": { od_mm: 114.3, od_in: 4.500, sch: { "40": 6.02, "80": 8.56, "120": 11.13, "160": 13.49, "xxs": 17.12, "std": 6.02, "xs": 8.56 } },
  "5": { od_mm: 141.3, od_in: 5.563, sch: { "40": 6.55, "80": 9.53, "160": 15.88, "xxs": 19.05, "std": 6.55, "xs": 9.53 } },
  "6": { od_mm: 168.3, od_in: 6.625, sch: { "40": 7.11, "80": 10.97, "120": 14.27, "160": 18.26, "xxs": 21.95, "std": 7.11, "xs": 10.97 } },
  "8": { od_mm: 219.1, od_in: 8.625, sch: { "20": 6.35, "30": 7.04, "40": 8.18, "60": 10.31, "80": 12.70, "100": 15.09, "120": 18.26, "140": 20.62, "160": 23.01, "xxs": 22.22, "std": 8.18, "xs": 12.70 } },
  "10": { od_mm: 273.0, od_in: 10.750, sch: { "20": 6.35, "40": 9.27, "60": 12.70, "80": 15.09, "100": 18.26, "120": 21.44, "140": 25.40, "160": 28.58, "xxs": 25.40, "std": 9.27, "xs": 15.09 } },
  "12": { od_mm: 323.8, od_in: 12.750, sch: { "20": 6.35, "30": 8.38, "40": 10.31, "60": 14.27, "80": 17.48, "100": 21.44, "120": 25.40, "140": 28.58, "160": 33.32, "xxs": 25.40, "std": 10.31, "xs": 17.48 } },
  "14": { od_mm: 355.6, od_in: 14.000, sch: { "10": 6.35, "20": 7.92, "30": 9.53, "40": 11.13, "60": 15.09, "80": 19.05, "100": 23.83, "120": 27.79, "140": 31.75, "160": 35.71, "std": 9.53, "xs": 12.70 } },
  "16": { od_mm: 406.4, od_in: 16.000, sch: { "10": 6.35, "20": 7.92, "30": 9.53, "40": 12.70, "60": 16.66, "80": 21.44, "100": 26.19, "120": 30.96, "140": 36.53, "160": 40.49, "std": 9.53, "xs": 12.70 } },
  "18": { od_mm: 457.0, od_in: 18.000, sch: { "10": 6.35, "20": 7.92, "30": 11.13, "40": 14.27, "60": 19.05, "80": 23.83, "100": 29.36, "120": 34.93, "140": 39.67, "160": 45.24, "std": 9.53, "xs": 12.70 } },
  "20": { od_mm: 508.0, od_in: 20.000, sch: { "10": 6.35, "20": 9.53, "30": 12.70, "40": 15.09, "60": 20.62, "80": 26.19, "100": 32.54, "120": 38.10, "140": 44.45, "160": 50.01, "std": 9.53, "xs": 12.70 } },
  "24": { od_mm: 610.0, od_in: 24.000, sch: { "10": 6.35, "20": 9.53, "30": 14.27, "40": 17.48, "60": 24.61, "80": 30.96, "100": 38.89, "120": 46.02, "140": 52.37, "160": 59.54, "std": 9.53, "xs": 12.70 } }
};

// 2. Material P-Number Classifications (ASME Section IX Table QW/QB-422)
const MATERIALS_DB = {
  "a106": { spec: "ASTM A106 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "a106-b": { spec: "ASTM A106 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "a106grb": { spec: "ASTM A106 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "sa106": { spec: "ASME SA-106 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "sa-106": { spec: "ASME SA-106 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "a53": { spec: "ASTM A53 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "sa516": { spec: "ASME SA-516 Gr 70", p_no: "P-No. 1", group: "Group 2", smts_ksi: 70, smts_mpa: 485 },
  "sa-516": { spec: "ASME SA-516 Gr 70", p_no: "P-No. 1", group: "Group 2", smts_ksi: 70, smts_mpa: 485 },
  "sa516gr70": { spec: "ASME SA-516 Gr 70", p_no: "P-No. 1", group: "Group 2", smts_ksi: 70, smts_mpa: 485 },
  "sa516-70": { spec: "ASME SA-516 Gr 70", p_no: "P-No. 1", group: "Group 2", smts_ksi: 70, smts_mpa: 485 },
  "a333": { spec: "ASTM A333 Gr 6", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "api5l": { spec: "API 5L Gr B / X52", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 },
  "4130": { spec: "AISI 4130", p_no: "P-No. 4", group: "Group 1", smts_ksi: 75, smts_mpa: 517 },
  "aisi4130": { spec: "AISI 4130", p_no: "P-No. 4", group: "Group 1", smts_ksi: 75, smts_mpa: 517 },
  "p91": { spec: "ASTM A335 Gr P91", p_no: "P-No. 15E", group: "Group 1", smts_ksi: 85, smts_mpa: 585 },
  "p-15e": { spec: "P-No. 15E (P91)", p_no: "P-No. 15E", group: "Group 1", smts_ksi: 85, smts_mpa: 585 },
  "304": { spec: "ASTM A312 TP304", p_no: "P-No. 8", group: "Group 1", smts_ksi: 75, smts_mpa: 515 },
  "316": { spec: "ASTM A312 TP316", p_no: "P-No. 8", group: "Group 1", smts_ksi: 75, smts_mpa: 515 }
};

/**
 * Parses pipe size, schedule, and material from user prompt
 */
function parsePipeQuery(text) {
  const normText = text.toLowerCase().replace(/['"″]/g, ' in');
  
  // Extract NPS Size: e.g. "6NPS", "6 NPS", "6 inch", "6-inch", "NPS 6", "6in"
  let nps = null;
  const npsMatch = normText.match(/\b(?:nps\s*([0-9\.\/-]+)|([0-9\.\/-]+)\s*(?:nps|inch|\"|in\b|-inch))\b/i);
  if (npsMatch) {
    nps = (npsMatch[1] || npsMatch[2] || '').trim();
  }

  // Extract Schedule: e.g. "Sch80", "Sch 80", "Schedule 80", "XS", "XXS", "STD"
  let schedule = null;
  const schMatch = normText.match(/\b(?:sch(?:edule)?\.?\s*([0-9]+|xxs|xs|std)|(xxs|xs|std))\b/i);
  if (schMatch) {
    schedule = (schMatch[1] || schMatch[2] || '').toLowerCase();
  }

  // Extract Material / P-Number
  let matKey = null;
  const matMatch = normText.match(/\b(a106(?:[\s\-]?b|[\s\-]?gr(?:ade)?[\s\-]?b)?|sa-?106|sa-?516(?:[\s\-]?gr(?:ade)?[\s\-]?70)?|a53|a333|api\s*5l|4130|aisi\s*4130|p91|p-?15e|304|316)\b/i);
  if (matMatch) {
    matKey = matMatch[1].replace(/[\s\-_]/g, '').toLowerCase();
  }

  const isSour = /\b(sour|h2s|nace|mr0175|iso\s*15156)\b/i.test(normText);
  return { nps, schedule, matKey, isSour };
}

/**
 * Calculates authoritative code values for equipment size, preheat, and PWHT
 */
function calculateCodeSafetyRequirements(queryOrParams) {
  let params = typeof queryOrParams === 'string' ? parsePipeQuery(queryOrParams) : queryOrParams;
  const { nps, schedule, matKey, isSour } = params;

  if (!nps || !schedule) {
    return { matched: false, reason: "Missing NPS size or schedule" };
  }

  const cleanNps = nps.replace(/^nps\s*/i, '').trim();
  const cleanSch = schedule.replace(/^sch(?:edule)?\.?\s*/i, '').toLowerCase().trim();

  const pipeData = PIPE_DIMENSIONS[cleanNps];
  if (!pipeData) {
    return { matched: false, reason: `Unrecognized NPS size: ${cleanNps}` };
  }

  const wallMm = pipeData.sch[cleanSch];
  if (!wallMm) {
    return { matched: false, reason: `Schedule ${cleanSch} not found for NPS ${cleanNps}` };
  }
  const wallIn = +(wallMm / 25.4).toFixed(3);

  // Material resolution
  let mat = matKey ? MATERIALS_DB[matKey] : null;
  if (!mat) {
    // Default to P-No. 1 carbon steel if unspecified
    mat = { spec: "ASTM A106 Gr B", p_no: "P-No. 1", group: "Group 1", smts_ksi: 60, smts_mpa: 415 };
  }

  // 1. Preheat determination (ASME B31.3 Table 330.1.1)
  let preheatMinC = 10;
  let preheatMinF = 50;
  let preheatRule = "";
  let preheatClause = "ASME B31.3 Table 330.1.1";

  if (mat.p_no === 'P-No. 1') {
    if (wallMm > 25.0 || mat.smts_mpa > 490) {
      preheatMinC = 95;
      preheatMinF = 200;
      preheatRule = `Wall thickness ${wallMm} mm > 25 mm (1 in): Mandatory preheat is 95°C (200°F).`;
    } else {
      preheatMinC = 10;
      preheatMinF = 50;
      preheatRule = `Wall thickness ${wallMm} mm <= 25 mm (1 in) and SMTS <= 490 MPa: Minimum preheat is 10°C (50°F) (ambient). 200°F is NOT required.`;
    }
  } else if (mat.p_no === 'P-No. 4') {
    preheatMinC = 150;
    preheatMinF = 300;
    preheatRule = `P-No. 4 alloy steel requires 150°C (300°F) minimum preheat for all thicknesses.`;
  } else if (mat.p_no === 'P-No. 15E') {
    preheatMinC = 200;
    preheatMinF = 400;
    preheatRule = `P-No. 15E (P91) requires 200°C (400°F) minimum preheat for all thicknesses.`;
  }

  // 2. PWHT determination (ASME B31.3 Table 331.1.1)
  let pwhtRequired = false;
  let pwhtThresholdMm = 19.05; // 0.75 in
  let pwhtTempRangeC = "595°C - 650°C";
  let pwhtTempRangeF = "1100°F - 1200°F";
  let pwhtRuling = "";
  let pwhtClause = "ASME B31.3 Table 331.1.1";

  if (mat.p_no === 'P-No. 1') {
    if (wallMm > pwhtThresholdMm) {
      pwhtRequired = true;
      pwhtRuling = `MANDATORY PWHT required: Wall thickness ${wallMm} mm exceeds 19.05 mm (0.75 in) threshold. Soak temp: ${pwhtTempRangeC} (${pwhtTempRangeF}) for 1 hr/in (min 1 hr).`;
    } else {
      pwhtRequired = false;
      pwhtRuling = `PWHT is NOT required (EXEMPT): Wall thickness ${wallMm} mm <= 19.05 mm (0.75 in) threshold per Table 331.1.1 exemption note.`;
    }
  } else if (mat.p_no === 'P-No. 4') {
    pwhtRequired = true;
    pwhtTempRangeC = "595°C - 700°C";
    pwhtRuling = `MANDATORY PWHT for P-No. 4: 595°C - 700°C (1100°F - 1300°F).`;
  } else if (mat.p_no === 'P-No. 15E') {
    pwhtRequired = true;
    pwhtTempRangeC = "730°C - 775°C";
    pwhtRuling = `MANDATORY PWHT for P-No. 15E (P91): 730°C - 775°C (1350°F - 1425°F).`;
  }

  // Sour service hardness cap per NACE MR0175 / ISO 15156
  const maxHardnessHrc = isSour ? 22 : null;

  const authoritativeBlock = `[CODE CALCULATOR RESULT - authoritative]
• Equipment / Piping: ${cleanNps}" NPS Schedule ${cleanSch.toUpperCase()} (ASME B36.10M Table 1)
• Outer Diameter: ${pipeData.od_mm} mm (${pipeData.od_in} in)
• Nominal Wall Thickness: ${wallMm} mm (${wallIn} in)
• Material Specification: ${mat.spec} (${mat.p_no} ${mat.group})
• Minimum Preheat Required: ${preheatMinC}°C (${preheatMinF}°F) [Governing: ${preheatClause}]
  └─ Ruling: ${preheatRule}
• PWHT Requirement: ${pwhtRequired ? 'MANDATORY' : 'NOT REQUIRED (EXEMPT)'} [Governing: ${pwhtClause}]
  └─ Ruling: ${pwhtRuling}
${maxHardnessHrc ? `• Sour Service Hardness Limit: <= ${maxHardnessHrc} HRC (250 HV) per NACE MR0175 / ISO 15156` : ''}
• Binding Clauses: ASME B31.3 Table 330.1.1, ASME B31.3 Table 331.1.1, ASME B36.10M Table 1`;

  return {
    matched: true,
    nps: cleanNps,
    schedule: cleanSch.toUpperCase(),
    outer_diameter_mm: pipeData.od_mm,
    outer_diameter_in: pipeData.od_in,
    wall_thickness_mm: wallMm,
    wall_thickness_in: wallIn,
    material_spec: mat.spec,
    p_number: mat.p_no,
    group_number: mat.group,
    preheat_min_c: preheatMinC,
    preheat_min_f: preheatMinF,
    preheat_rule: preheatRule,
    preheat_clause: preheatClause,
    pwht_required: pwhtRequired,
    pwht_threshold_mm: pwhtThresholdMm,
    pwht_temp_range_c: pwhtTempRangeC,
    pwht_temp_range_f: pwhtTempRangeF,
    pwht_ruling: pwhtRuling,
    pwht_clause: pwhtClause,
    max_hardness_hrc: maxHardnessHrc,
    binding_clauses: [
      preheatClause,
      pwhtClause,
      "ASME B36.10M Table 1",
      ...(isSour ? ["NACE MR0175 / ISO 15156 Clause A.2.1"] : [])
    ],
    authoritative_block: authoritativeBlock
  };
}

export {
  PIPE_DIMENSIONS,
  MATERIALS_DB,
  parsePipeQuery,
  calculateCodeSafetyRequirements
};

if (typeof globalThis !== 'undefined' && globalThis['module'] && globalThis['module'].exports) {
  globalThis['module'].exports = {
    PIPE_DIMENSIONS,
    MATERIALS_DB,
    parsePipeQuery,
    calculateCodeSafetyRequirements
  };
}


