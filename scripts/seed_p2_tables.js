const { execSync } = require('child_process');
const fs = require('fs');

const tables = [
  {
    standard_code: 'ASME IX',
    edition: '2019/2023',
    table_id: 'Table QW/QB-422',
    table_title: 'Table QW/QB-422 — Ferrous P-Numbers & Group Numbers for Base Metals (Pressure Boundary Carbon Steels)',
    section_context: 'QW-420 Material Groupings',
    headers_json: JSON.stringify(['Spec No.', 'Grade', 'UNS', 'Min Tensile ksi (MPa)', 'Welding P-No.', 'Group No.', 'Nominal Composition', 'Product Form']),
    raw_markdown: `| Spec No. | Grade | UNS | Min Tensile ksi (MPa) | Welding P-No. | Group No. | Nominal Composition | Product Form |
|---|---|---|---|---|---|---|---|
| SA-516 | Gr 55 | K01800 | 55 (380) | 1 | 1 | C-Si | Plate |
| SA-516 | Gr 60 | K02100 | 60 (415) | 1 | 1 | C-Mn-Si | Plate |
| SA-516 | Gr 65 | K02403 | 65 (450) | 1 | 1 | C-Mn-Si | Plate |
| SA-516 | Gr 70 | K02700 | 70 (485) | 1 | 2 | C-Mn-Si | Plate |
| SA-106 | Gr A | K02501 | 48 (330) | 1 | 1 | C-Si | Seamless pipe |
| SA-106 | Gr B | K03006 | 60 (415) | 1 | 1 | C-Mn-Si | Seamless pipe |
| SA-106 | Gr C | K03501 | 70 (485) | 1 | 2 | C-Mn-Si | Seamless pipe |
| SA-105 | - | K03504 | 70 (485) | 1 | 2 | C | Forgings |
| SA-333 | Gr 6 | K03006 | 60 (415) | 1 | 1 | C-Mn-Si | Seamless & welded pipe |
| SA-335 | P91 | K90901 | 85 (585) | 15E | 1 | 9Cr-1Mo-V | Seamless alloy pipe |`,
    structured_json: JSON.stringify([
      { spec: 'SA-516', grade: 'Gr 70', uns: 'K02700', min_tensile_ksi: 70, min_tensile_mpa: 485, p_no: 1, group_no: 2, nominal_comp: 'C-Mn-Si', product_form: 'Plate' },
      { spec: 'SA-516', grade: 'Gr 60', uns: 'K02100', min_tensile_ksi: 60, min_tensile_mpa: 415, p_no: 1, group_no: 1, nominal_comp: 'C-Mn-Si', product_form: 'Plate' },
      { spec: 'SA-106', grade: 'Gr B', uns: 'K03006', min_tensile_ksi: 60, min_tensile_mpa: 415, p_no: 1, group_no: 1, nominal_comp: 'C-Mn-Si', product_form: 'Seamless pipe' },
      { spec: 'SA-105', grade: '-', uns: 'K03504', min_tensile_ksi: 70, min_tensile_mpa: 485, p_no: 1, group_no: 2, nominal_comp: 'C', product_form: 'Forgings' }
    ])
  },
  {
    standard_code: 'API 1104',
    edition: '21st/22nd ED',
    table_id: 'Table 1',
    table_title: 'Table 1 & Section 9 — Acceptance Limits for Imperfections (12-inch Foot-Run Weld Criteria)',
    section_context: 'Section 9 Acceptance Standards for NDT',
    headers_json: JSON.stringify(['Discontinuity Type', 'Maximum Individual Dimension', 'Maximum Accumulated Length in 12-in. (300 mm) Continuous Weld (Foot-Run)']),
    raw_markdown: `| Discontinuity Type | Maximum Individual Dimension | Maximum Accumulated Length in 12-in. (300 mm) Continuous Weld (Foot-Run) |
|---|---|---|
| Inadequate Penetration without High-Low (IP) | 1 in. (25 mm) | 1 in. (25 mm) in any continuous 12-in. (300 mm) weld length |
| Inadequate Penetration due to High-Low (IPD) | 2 in. (50 mm) | 3 in. (75 mm) in any continuous 12-in. (300 mm) weld length |
| Incomplete Fusion (IF) | 1 in. (25 mm) | 1 in. (25 mm) in any continuous 12-in. (300 mm) weld length |
| Burn-Through (BT) | 1/4 in. (6 mm) or tw | Accumulated length shall not exceed 1/2 in. (13 mm) in 12 in. (300 mm) weld length |
| Slag Inclusions (Elongated ISI) | 2 in. (50 mm) in length, 1/16 in. (1.6 mm) width | 2 in. (50 mm) in any continuous 12-in. (300 mm) weld length |
| Undercutting (EU/IU) | Depth > 1/32 in. (0.8 mm) or > 12.5% tw | Max 2 in. (50 mm) in any continuous 12-in. (300 mm) weld length |`,
    structured_json: JSON.stringify([
      { defect: 'Inadequate Penetration (IP)', max_individual: '1 in. (25 mm)', foot_run_12in_limit: '1 in. (25 mm)' },
      { defect: 'Inadequate Penetration High-Low (IPD)', max_individual: '2 in. (50 mm)', foot_run_12in_limit: '3 in. (75 mm)' },
      { defect: 'Incomplete Fusion (IF)', max_individual: '1 in. (25 mm)', foot_run_12in_limit: '1 in. (25 mm)' },
      { defect: 'Burn-Through (BT)', max_individual: '1/4 in. (6 mm)', foot_run_12in_limit: '1/2 in. (13 mm)' },
      { defect: 'Slag Inclusions (ISI)', max_individual: '2 in. (50 mm)', foot_run_12in_limit: '2 in. (50 mm)' },
      { defect: 'Undercutting', max_individual: 'Depth > 1/32 in.', foot_run_12in_limit: '2 in. (50 mm)' }
    ])
  },
  {
    standard_code: 'ASME B31.3',
    edition: '2020/2022',
    table_id: 'Table 341.3.2',
    table_title: 'Table 341.3.2 & Table 304.1.1 — Acceptance Criteria for Welds and Wall-Thickness Verification',
    section_context: 'Chapter VI Inspection, Examination, and Testing',
    headers_json: JSON.stringify(['Parameter / Imperfection', 'Normal Fluid Service Limit', 'Severe Cyclic Limit', 'Design Notes']),
    raw_markdown: `| Parameter / Imperfection | Normal Fluid Service Limit | Severe Cyclic Limit | Design & Verification Notes |
|---|---|---|---|
| Wall Thickness Verification (tm) | tm = t + c (minimum required wall thickness) | tm = t + c | t = PD / (2(SEW + PY)); must verify nominal thickness minus mill undertolerance (typically 12.5%) |
| Undercut Depth | <= 1 mm (1/32 in.) and <= tw/4 | Zero undercut permitted (none) | Length and depth verification per Table 341.3.2 |
| Incomplete Penetration | Cumulative <= 38 mm (1.5 in.) in 150 mm (6 in.) weld | Zero permitted (none) | Complete penetration required for severe cyclic |
| Lack of Fusion | Cumulative <= 38 mm (1.5 in.) in 150 mm (6 in.) weld | Zero permitted (none) | Complete fusion mandatory |
| Cracks | Zero permitted (none) | Zero permitted (none) | All cracks are rejectable |`,
    structured_json: JSON.stringify([
      { parameter: 'Wall Thickness (tm)', formula: 'tm = t + c', pressure_design_formula: 't = PD / (2(SEW + PY))', undertolerance: '12.5%' },
      { parameter: 'Undercut', normal_service: '<= 1 mm (1/32 in.) and <= tw/4', severe_cyclic: 'Zero permitted' },
      { parameter: 'Incomplete Penetration', normal_service: '<= 38 mm in 150 mm', severe_cyclic: 'Zero permitted' }
    ])
  }
];

let sql = '';
for (const t of tables) {
  const safeTitle = t.table_title.replace(/'/g, "''");
  const safeContext = (t.section_context || '').replace(/'/g, "''");
  const safeHeaders = t.headers_json.replace(/'/g, "''");
  const safeMd = t.raw_markdown.replace(/'/g, "''");
  const safeJson = t.structured_json.replace(/'/g, "''");

  sql += `DELETE FROM standards_tables WHERE standard_code = '${t.standard_code}' AND table_id = '${t.table_id}';\n`;
  sql += `INSERT INTO standards_tables (standard_code, edition, table_id, table_title, section_context, headers_json, raw_markdown, structured_json, scope)
    VALUES ('${t.standard_code}', '${t.edition}', '${t.table_id}', '${safeTitle}', '${safeContext}', '${safeHeaders}', '${safeMd}', '${safeJson}', 'global');\n`;
}

fs.writeFileSync('worker/temp_seed_tables.sql', sql, 'utf8');
try {
  execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_seed_tables.sql', {
    cwd: 'worker',
    encoding: 'utf8'
  });
  console.log("✓ Successfully seeded core tables into standards_tables!");
} finally {
  if (fs.existsSync('worker/temp_seed_tables.sql')) fs.unlinkSync('worker/temp_seed_tables.sql');
}
