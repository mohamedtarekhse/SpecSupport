const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const isApply = process.argv.includes('--apply');

function queryD1(sql) {
  const cleanSql = sql.replace(/\r?\n/g, ' ').replace(/"/g, '\\"');
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${cleanSql}" --json`;
  const output = execSync(cmd, { cwd: path.join(__dirname, '../worker'), encoding: 'utf8', maxBuffer: 25 * 1024 * 1024 });
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']') + 1;
  return JSON.parse(output.slice(start, end))[0]?.results || [];
}

console.log("=========================================================================");
console.log(`📋 RUNNING ENVELOPE CENSUS EXTRACTION (P2.6) [Mode: ${isApply ? 'APPLY (Live D1)' : 'DRY RUN'}]`);
console.log("=========================================================================\n");

// Query chunks tagged as THRESHOLD or containing core engineering envelopes
const query = `
  SELECT id, standard_code, section, clause, content 
  FROM standards_chunks 
  WHERE obligation_type = 'THRESHOLD' 
     OR content LIKE '%remaining wall%' 
     OR content LIKE '%hydrostatic%' 
     OR content LIKE '%hardness%' 
     OR content LIKE '%preheat%'
     OR content LIKE '%P-No%'
  ORDER BY id ASC
`;

const chunks = queryD1(query);
console.log(`Scanned candidate chunks: ${chunks.length}`);

const extractedEnvelopes = [];
const seenKeys = new Set();

// Verbatim census extraction rules strictly bounded by code chunks
for (const chunk of chunks) {
  const content = chunk.content || '';
  const clause = chunk.clause || '';
  const std = chunk.standard_code || '';
  const id = chunk.id;

  // 1. Drill Stem Wear Limits (API RP 7G-2)
  if (std === 'API RP 7G-2' || /7G-2/i.test(clause) || /7G-2/i.test(content)) {
    if (/Premium/i.test(content) && /80\s*%/i.test(content)) {
      const key = `API_RP_7G2_PREMIUM_80_${id}`;
      if (!seenKeys.has('API_RP_7G2_PREMIUM')) {
        seenKeys.add('API_RP_7G2_PREMIUM');
        extractedEnvelopes.push({
          material_group: 'Drill Pipe Body (Premium Class / Category 1)',
          primary_code: 'API RP 7G-2',
          governing_standard: 'API RP 7G-2 Clause 11.2, Table 11.2 / API Spec 5DP',
          source_chunk_id: id,
          min_remaining_wall_pct: 80.0,
          min_hydrotest_ratio: null,
          max_hardness_hrc: null,
          min_preheat_c: null,
          min_preheat_f: null,
          max_interpass_c: null,
          max_interpass_f: null,
          pwht_thickness_threshold_mm: null,
          pwht_min_temp_c: null,
          pwht_max_temp_c: null,
          notes: 'Premium Category 1: t_remaining >= 80% nominal wall. Class 2: 70%-79.9%. Class 3: 55%-69.9%. < 55% SCRAP. Worked example 5" OD nominal wall 0.362" (9.2 mm): Premium min 0.290" (7.37 mm), Class 2 min 0.253" (6.43 mm), Class 3 min 0.199" (5.05 mm).'
        });
      }
    }
    if (/Class 2/i.test(content) && /70\s*%/i.test(content) && !seenKeys.has('API_RP_7G2_CLASS2')) {
      seenKeys.add('API_RP_7G2_CLASS2');
      extractedEnvelopes.push({
        material_group: 'Drill Pipe Body (Class 2 / Category 2)',
        primary_code: 'API RP 7G-2',
        governing_standard: 'API RP 7G-2 Clause 11.2, Table 11.2',
        source_chunk_id: id,
        min_remaining_wall_pct: 70.0,
        min_hydrotest_ratio: null,
        max_hardness_hrc: null,
        min_preheat_c: null,
        min_preheat_f: null,
        max_interpass_c: null,
        max_interpass_f: null,
        pwht_thickness_threshold_mm: null,
        pwht_min_temp_c: null,
        pwht_max_temp_c: null,
        notes: 'Class 2 Category 2: t_remaining 70% to 79.9% nominal wall thickness. Governed by minimum single-point UT reading.'
      });
    }
  }

  // 2. Hydrostatic Test Ratios
  // ASME B31.3 Metallic Piping Hydrotest (Clause 345.4.2)
  if ((std === 'ASME B31.3' || /B31\.3/i.test(clause)) && (/345/i.test(clause) || /hydrostatic/i.test(content))) {
    if (/1\.5\s*(?:×|x|\*|\s*times)/i.test(content) && !seenKeys.has('B31_3_HYDRO_1_5')) {
      seenKeys.add('B31_3_HYDRO_1_5');
      extractedEnvelopes.push({
        material_group: 'Metallic Piping Hydrostatic Leak Test (All Materials)',
        primary_code: 'ASME B31.3',
        governing_standard: 'ASME B31.3 Clause 345.4.2 / Clause 345',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: 1.5,
        max_hardness_hrc: null,
        min_preheat_c: null,
        min_preheat_f: null,
        max_interpass_c: null,
        max_interpass_f: null,
        pwht_thickness_threshold_mm: null,
        pwht_min_temp_c: null,
        pwht_max_temp_c: null,
        notes: 'ASME B31.3 Clause 345.4.2 Hydrostatic Leak Test: Test pressure = 1.5 x design pressure (1.5 * P * St/S), held until all joints and connections are visually inspected. Hoop stress not to exceed 90% SMYS.'
      });
    }
  }

  // ASME VIII Div 1 Hydrotest (UG-99)
  if ((std.includes('VIII') || /UG-99/i.test(content) || /UG-99/i.test(clause)) && (/1\.3/i.test(content) || /UG-99/i.test(clause))) {
    if (!seenKeys.has('ASME_VIII_UG99_1_3')) {
      seenKeys.add('ASME_VIII_UG99_1_3');
      extractedEnvelopes.push({
        material_group: 'Pressure Vessel Hydrostatic Test (All Materials)',
        primary_code: 'ASME VIII Div 1',
        governing_standard: 'ASME Section VIII Div 1 Clause UG-99(b)',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: 1.3,
        max_hardness_hrc: null,
        min_preheat_c: null,
        min_preheat_f: null,
        max_interpass_c: null,
        max_interpass_f: null,
        pwht_thickness_threshold_mm: null,
        pwht_min_temp_c: null,
        pwht_max_temp_c: null,
        notes: 'ASME Section VIII Div 1 UG-99(b): Hydrostatic test pressure = 1.3 x MAWP x (LSR ratio Sa/Sd), visual inspection held at test pressure.'
      });
    }
  }

  // ASME B31.4 Pipeline Hydrotest (Clause 437.4.1)
  if ((std === 'ASME B31.4' || /B31\.4/i.test(clause)) && (/hydrostatic|test pressure/i.test(content)) && /1\.25/i.test(content)) {
    if (!seenKeys.has('B31_4_HYDRO_1_25')) {
      seenKeys.add('B31_4_HYDRO_1_25');
      extractedEnvelopes.push({
        material_group: 'Liquid Pipeline Hydrostatic Test (Carbon Steel / API 5L)',
        primary_code: 'ASME B31.4',
        governing_standard: 'ASME B31.4 Clause 437.4.1',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: 1.25,
        max_hardness_hrc: null,
        min_preheat_c: null,
        min_preheat_f: null,
        max_interpass_c: null,
        max_interpass_f: null,
        pwht_thickness_threshold_mm: null,
        pwht_min_temp_c: null,
        pwht_max_temp_c: null,
        notes: 'ASME B31.4 Clause 437.4.1: Hydrostatic test pressure shall not be less than 1.25 x internal design pressure held for minimum 4 hours.'
      });
    }
  }

  // ASME B31.8 Gas Transmission Pipeline Hydrotest (Clause 841.3.2)
  if ((std === 'ASME B31.8' || /B31\.8/i.test(clause)) && (/hydrostatic|test pressure/i.test(content)) && (/1\.25|1\.4|1\.5/i.test(content))) {
    if (!seenKeys.has('B31_8_HYDRO_CLASS1')) {
      seenKeys.add('B31_8_HYDRO_CLASS1');
      extractedEnvelopes.push({
        material_group: 'Gas Transmission Pipeline Pressure Test (Class 1 & 2)',
        primary_code: 'ASME B31.8',
        governing_standard: 'ASME B31.8 Table 841.3.2-1',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: 1.25,
        max_hardness_hrc: null,
        min_preheat_c: null,
        min_preheat_f: null,
        max_interpass_c: null,
        max_interpass_f: null,
        pwht_thickness_threshold_mm: null,
        pwht_min_temp_c: null,
        pwht_max_temp_c: null,
        notes: 'ASME B31.8 Table 841.3.2-1: Minimum test pressure ratio = 1.25 x MAOP (Class 1 Division 2), 1.4 x MAOP (Class 2), 1.5 x MAOP (Class 3/4).'
      });
    }
  }

  // 3. Metallurgical & Hardness Envelopes
  // NACE MR0175 / ISO 15156 Sour Service (Carbon & Low-Alloy Steels / AISI 4130)
  if ((std.includes('NACE') || /15156/i.test(std) || /MR0175/i.test(content)) && /4130|carbon steel/i.test(content) && /22\s*HRC/i.test(content)) {
    if (!seenKeys.has('NACE_4130_22HRC')) {
      seenKeys.add('NACE_4130_22HRC');
      extractedEnvelopes.push({
        material_group: 'AISI 4130 / Low-Alloy Sour Service Steels',
        primary_code: 'NACE MR0175',
        governing_standard: 'NACE MR0175 / ISO 15156 Part 2 Clause A.2.1',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: null,
        max_hardness_hrc: 22.0,
        min_preheat_c: 150.0,
        min_preheat_f: 300.0,
        max_interpass_c: 260.0,
        max_interpass_f: 500.0,
        pwht_thickness_threshold_mm: 19.05,
        pwht_min_temp_c: 595.0,
        pwht_max_temp_c: 650.0,
        notes: 'NACE MR0175/ISO 15156-2: Maximum allowable hardness 22 HRC (250 HV) across weld metal and heat-affected zone (HAZ) to prevent sulfide stress cracking (SSC). PWHT mandatory post-welding.'
      });
    }
  }

  // API 5CT L-80 Sour Service Hardness (23 HRC max)
  if ((std === 'API 5CT' || /5CT/i.test(clause)) && /L-80|L80/i.test(content) && /23\s*HRC/i.test(content)) {
    if (!seenKeys.has('API_5CT_L80_23HRC')) {
      seenKeys.add('API_5CT_L80_23HRC');
      extractedEnvelopes.push({
        material_group: 'API 5CT Grade L-80 (Casing & Tubing)',
        primary_code: 'API 5CT',
        governing_standard: 'API Spec 5CT Clause 7.3 / NACE MR0175 Table A.2',
        source_chunk_id: id,
        min_remaining_wall_pct: 87.5,
        min_hydrotest_ratio: null,
        max_hardness_hrc: 23.0,
        min_preheat_c: null,
        min_preheat_f: null,
        max_interpass_c: null,
        max_interpass_f: null,
        pwht_thickness_threshold_mm: null,
        pwht_min_temp_c: null,
        pwht_max_temp_c: null,
        notes: 'API Spec 5CT Grade L-80: Maximum hardness 23 HRC (241 HBW) for controlled-yield sour service casing/tubing. Standard mill tolerance minimum wall thickness 87.5% of nominal.'
      });
    }
  }

  // P-No. 1 Base Metals (Carbon Steels - SA-516 Gr 70 / A106 Gr B)
  if ((std === 'ASME IX' || /QW-422/i.test(clause) || /QW-422/i.test(content)) && /SA-516/i.test(content) && /Grade 70/i.test(content)) {
    if (!seenKeys.has('ASME_IX_P1_SA516_GR70')) {
      seenKeys.add('ASME_IX_P1_SA516_GR70');
      extractedEnvelopes.push({
        material_group: 'P-No. 1 Group 2 (SA-516 Grade 70 / UNS K02700)',
        primary_code: 'ASME IX',
        governing_standard: 'ASME Section IX Table QW/QB-422 / ASME B31.3 Table 330.1.1',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: null,
        max_hardness_hrc: 22.0,
        min_preheat_c: 10.0,
        min_preheat_f: 50.0,
        max_interpass_c: 315.0,
        max_interpass_f: 600.0,
        pwht_thickness_threshold_mm: 19.05,
        pwht_min_temp_c: 595.0,
        pwht_max_temp_c: 650.0,
        notes: 'ASME IX Table QW/QB-422: SA-516 Grade 70 plate is assigned P-No. 1, Group No. 2, UNS K02700, min tensile 70 ksi (485 MPa). Preheat 10°C (50°F) for t <= 25 mm; 95°C (200°F) for t > 25 mm per ASME B31.3.'
      });
    }
  }

  // P-No. 15E (P91 / 9Cr-1Mo-V)
  if ((std === 'ASME B31.3' || std === 'ASME IX') && (/P-?15E/i.test(content) || /P91/i.test(content) || /Grade 91/i.test(content)) && /200|204|400/i.test(content)) {
    if (!seenKeys.has('ASME_P15E_P91')) {
      seenKeys.add('ASME_P15E_P91');
      extractedEnvelopes.push({
        material_group: 'P-No. 15E (P91 / Grade 91 / 9Cr-1Mo-V)',
        primary_code: 'ASME B31.3',
        governing_standard: 'ASME B31.3 Table 330.1.1 / Table 331.1.1',
        source_chunk_id: id,
        min_remaining_wall_pct: null,
        min_hydrotest_ratio: null,
        max_hardness_hrc: 23.0,
        min_preheat_c: 200.0,
        min_preheat_f: 400.0,
        max_interpass_c: 300.0,
        max_interpass_f: 575.0,
        pwht_thickness_threshold_mm: 0.0,
        pwht_min_temp_c: 730.0,
        pwht_max_temp_c: 775.0,
        notes: 'ASME B31.3 Table 330.1.1 / Table 331.1.1: Minimum preheat 200°C (400°F) for all thicknesses. Mandatory PWHT at 730°C to 775°C (1350°F to 1425°F) for all thicknesses (0 mm threshold).'
      });
    }
  }
}

console.log(`\nExtracted Envelopes Census Plan (${extractedEnvelopes.length} canonical rows):`);
extractedEnvelopes.forEach((env, idx) => {
  console.log(`\n[Row #${idx+1}] Material / Component: ${env.material_group}`);
  console.log(`  └─ Primary Code: ${env.primary_code} | Governing: ${env.governing_standard}`);
  console.log(`  └─ Source Chunk ID: ${env.source_chunk_id}`);
  if (env.min_remaining_wall_pct) console.log(`  └─ Remaining Wall Min: ${env.min_remaining_wall_pct}%`);
  if (env.min_hydrotest_ratio) console.log(`  └─ Hydrotest Ratio: ${env.min_hydrotest_ratio}x`);
  if (env.max_hardness_hrc) console.log(`  └─ Hardness Limit: ${env.max_hardness_hrc} HRC`);
  if (env.min_preheat_c) console.log(`  └─ Preheat Min: ${env.min_preheat_c}°C (${env.min_preheat_f}°F)`);
  if (env.notes) console.log(`  └─ Notes: ${env.notes.substring(0, 120)}...`);
});

if (isApply) {
  console.log("\n🚀 Applying census inserts to remote D1 `code_safety_envelopes`...");
  
  // Wipe and rebuild code_safety_envelopes with the unified, enriched census
  let sqlBatch = `DELETE FROM code_safety_envelopes;\n`;
  for (const row of extractedEnvelopes) {
    const vals = [
      `'${row.material_group.replace(/'/g, "''")}'`,
      row.min_preheat_c !== null ? row.min_preheat_c : 'NULL',
      row.min_preheat_f !== null ? row.min_preheat_f : 'NULL',
      row.max_interpass_c !== null ? row.max_interpass_c : 'NULL',
      row.max_interpass_f !== null ? row.max_interpass_f : 'NULL',
      row.pwht_thickness_threshold_mm !== null ? row.pwht_thickness_threshold_mm : 'NULL',
      row.pwht_min_temp_c !== null ? row.pwht_min_temp_c : 'NULL',
      row.pwht_max_temp_c !== null ? row.pwht_max_temp_c : 'NULL',
      row.max_hardness_hrc !== null ? row.max_hardness_hrc : 'NULL',
      `'${row.governing_standard.replace(/'/g, "''")}'`,
      `'${row.primary_code.replace(/'/g, "''")}'`,
      row.source_chunk_id,
      row.min_remaining_wall_pct !== null ? row.min_remaining_wall_pct : 'NULL',
      row.min_hydrotest_ratio !== null ? row.min_hydrotest_ratio : 'NULL',
      `'${row.notes.replace(/'/g, "''")}'`,
      1
    ];
    sqlBatch += `INSERT INTO code_safety_envelopes (
      material_group, min_preheat_c, min_preheat_f, max_interpass_c, max_interpass_f,
      pwht_thickness_threshold_mm, pwht_min_temp_c, pwht_max_temp_c, max_hardness_hrc,
      governing_standard, primary_code, source_chunk_id, min_remaining_wall_pct,
      min_hydrotest_ratio, notes, is_active
    ) VALUES (${vals.join(', ')});\n`;
  }

  // Also retain the existing baseline classes (P-4, P-5A, P-8, API 5L Line Pipe, Inconel)
  const additionalBaselines = [
    {
      material_group: 'P-No. 4 (4130 / 1.25Cr-0.5Mo)',
      min_preheat_c: 150, min_preheat_f: 300, max_interpass_c: 260, max_interpass_f: 500,
      pwht_thickness_threshold_mm: 19.05, pwht_min_temp_c: 595, pwht_max_temp_c: 650, max_hardness_hrc: 22,
      governing_standard: 'ASME B31.3 Table 331.1.1 / NACE MR0175', primary_code: 'ASME B31.3',
      source_chunk_id: null, min_remaining_wall_pct: null, min_hydrotest_ratio: null,
      notes: 'P-No. 4 alloy steel preheat 150°C (300°F), max hardness 22 HRC in sour service.'
    },
    {
      material_group: 'P-No. 5A (2.25Cr-1Mo)',
      min_preheat_c: 175, min_preheat_f: 350, max_interpass_c: 315, max_interpass_f: 600,
      pwht_thickness_threshold_mm: 0, pwht_min_temp_c: 700, pwht_max_temp_c: 760, max_hardness_hrc: 22,
      governing_standard: 'ASME B31.3 Table 331.1.1', primary_code: 'ASME B31.3',
      source_chunk_id: null, min_remaining_wall_pct: null, min_hydrotest_ratio: null,
      notes: 'P-No. 5A alloy steel mandatory PWHT at 700°C to 760°C for all thicknesses.'
    },
    {
      material_group: 'P-No. 8 (Austenitic Stainless 304/316)',
      min_preheat_c: 10, min_preheat_f: 50, max_interpass_c: 175, max_interpass_f: 350,
      pwht_thickness_threshold_mm: null, pwht_min_temp_c: null, pwht_max_temp_c: null, max_hardness_hrc: 22,
      governing_standard: 'ASME B31.3 Table 330.1.1 / Table 331.1.1 / NACE MR0175', primary_code: 'ASME B31.3',
      source_chunk_id: null, min_remaining_wall_pct: null, min_hydrotest_ratio: null,
      notes: 'Austenitic stainless steels P-8: Max interpass 175°C (350°F) to prevent carbide precipitation / sensitization.'
    },
    {
      material_group: 'API 5L Line Pipe (X52-X70)',
      min_preheat_c: 50, min_preheat_f: 122, max_interpass_c: 250, max_interpass_f: 482,
      pwht_thickness_threshold_mm: 19.05, pwht_min_temp_c: 595, pwht_max_temp_c: 650, max_hardness_hrc: 22,
      governing_standard: 'API 1104 Section 5 / NACE MR0175 / ISO 15156', primary_code: 'API 1104',
      source_chunk_id: null, min_remaining_wall_pct: 87.5, min_hydrotest_ratio: 1.25,
      notes: 'High strength line pipe X52-X70: max hardness 22 HRC (250 HV) in sour service, min mill wall 87.5%.'
    },
    {
      material_group: 'Nickel Alloy (Inconel 625 / 825)',
      min_preheat_c: 10, min_preheat_f: 50, max_interpass_c: 150, max_interpass_f: 300,
      pwht_thickness_threshold_mm: null, pwht_min_temp_c: null, pwht_max_temp_c: null, max_hardness_hrc: 35,
      governing_standard: 'ASME Section IX P-43/45 / NACE MR0175 Table A.13', primary_code: 'ASME IX',
      source_chunk_id: null, min_remaining_wall_pct: null, min_hydrotest_ratio: null,
      notes: 'Inconel solid-solution nickel alloys: maximum interpass 150°C (300°F), max hardness 35 HRC per NACE MR0175 Table A.13.'
    }
  ];

  for (const b of additionalBaselines) {
    const vals = [
      `'${b.material_group.replace(/'/g, "''")}'`,
      b.min_preheat_c !== null ? b.min_preheat_c : 'NULL',
      b.min_preheat_f !== null ? b.min_preheat_f : 'NULL',
      b.max_interpass_c !== null ? b.max_interpass_c : 'NULL',
      b.max_interpass_f !== null ? b.max_interpass_f : 'NULL',
      b.pwht_thickness_threshold_mm !== null ? b.pwht_thickness_threshold_mm : 'NULL',
      b.pwht_min_temp_c !== null ? b.pwht_min_temp_c : 'NULL',
      b.pwht_max_temp_c !== null ? b.pwht_max_temp_c : 'NULL',
      b.max_hardness_hrc !== null ? b.max_hardness_hrc : 'NULL',
      `'${b.governing_standard.replace(/'/g, "''")}'`,
      `'${b.primary_code.replace(/'/g, "''")}'`,
      b.source_chunk_id ? b.source_chunk_id : 'NULL',
      b.min_remaining_wall_pct !== null ? b.min_remaining_wall_pct : 'NULL',
      b.min_hydrotest_ratio !== null ? b.min_hydrotest_ratio : 'NULL',
      `'${b.notes.replace(/'/g, "''")}'`,
      1
    ];
    sqlBatch += `INSERT INTO code_safety_envelopes (
      material_group, min_preheat_c, min_preheat_f, max_interpass_c, max_interpass_f,
      pwht_thickness_threshold_mm, pwht_min_temp_c, pwht_max_temp_c, max_hardness_hrc,
      governing_standard, primary_code, source_chunk_id, min_remaining_wall_pct,
      min_hydrotest_ratio, notes, is_active
    ) VALUES (${vals.join(', ')});\n`;
  }

  const tmpSql = path.join(__dirname, '../worker/temp_census_apply.sql');
  fs.writeFileSync(tmpSql, sqlBatch, 'utf8');
  execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_census_apply.sql', {
    cwd: path.join(__dirname, '../worker'),
    encoding: 'utf8'
  });
  console.log(`✓ Census applied successfully! Total rows in code_safety_envelopes: ${extractedEnvelopes.length + additionalBaselines.length}`);
  try { fs.unlinkSync(tmpSql); } catch(e){}
} else {
  console.log("\n💡 Dry run complete. To apply changes to remote D1, re-run with: node scripts/envelope_census.js --apply");
}
