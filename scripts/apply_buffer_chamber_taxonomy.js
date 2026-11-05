const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add chokeTax check to ensureTaxonomyTable
const taxTarget = '    isTaxonomyInitialized = true';
const taxInsert = `    // Ensure critical equipment taxonomy exists even if table was already populated
    try {
      const chokeTax = await db.prepare(\`SELECT count(*) as count FROM standards_taxonomy WHERE equipment_name LIKE '%Buffer Chamber%' OR equipment_name LIKE '%Choke Manifold%'\`).first();
      if (!chokeTax || chokeTax.count === 0) {
        await db.prepare(\`
          INSERT INTO standards_taxonomy (
            equipment_category, equipment_name, keywords, primary_standard, companion_standards, 
            prohibited_standards, governing_clause_table, default_service_condition, 
            primary_ndt_method, sop_personnel_qualification, mandatory_hold_point, inspection_frequencies
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`).bind(
          'Well Control & Manifolds',
          'Choke Manifolds & Buffer Chambers (Buffer Tanks)',
          'buffer chamber, buffer tank, buffer champer, choke manifold, choke line, kill line, manifold buffer, expansion chamber',
          'API Spec 16C / ASME Section VIII Division 1',
          'API Spec 6A (PSL 3 Flanges & Hubs), NACE MR0175 / ISO 15156 (Sour Service), API Standard 53',
          'API 16AR (Remanufacture of Drill-through Equipment only - NEVER use for new manufacturing of choke manifolds or buffer chambers!), API 1104, API RP 8B',
          'API Spec 16C Section 8 & 9 (Choke Manifold & Buffer Tank Fabrication) / ASME Section VIII Div 1 UG-27 (Shell Thickness) & UW (Welding)',
          'High Pressure Well Control Multiphase Kick / Sour Hydrocarbon Fluid Service (5,000 to 15,000 psi)',
          '100% Visual (VT), 100% Radiography (RT per ASME V Art 2 / UW-51) on butt welds, Wet Fluorescent MT (WFMPI) on nozzle attachments, 100% PT on API 6BX ring grooves, Hardness <= 22 HRC',
          'ASNT SNT-TC-1A / ISO 9712 Level II (RT/MT/PT) + AWS CWI / CSWIP 3.1 + ASME Authorized Inspector (AI) for ASME U-Stamp',
          'Hold Point (H): Fit-up/Root pass VT; 100% Post-PWHT RT/UT (delayed 24-48 hrs); Hydrostatic Proof Test at 1.5x Rated Working Pressure (15 min primary + 15 min secondary hold, zero leakage) witnessed by AI and TPI; ASME Form U-1A and API 16C COC sign-off.',
          'Manufacturing ITP hold points; Annual in-service wall thickness survey; Cat IV 5-Year recertification'
        ).run();
      }
    } catch(e) {
      console.error('ensureTaxonomyTable choke tax error:', e);
    }

    isTaxonomyInitialized = true`;

if (!code.includes(taxTarget)) {
  console.error('taxTarget not found!');
  process.exit(1);
}
code = code.replace(taxTarget, taxInsert);

// 2. Add Scope Demarcation for Choke Manifolds & Buffer Chambers
const promptTarget = '  * PRESSURE VESSELS: Compare ASME Section VIII Div 1 vs. Div 2 vs. PD 5500 vs. EN 13445.';
const promptInsert = `  * PRESSURE VESSELS: Compare ASME Section VIII Div 1 vs. Div 2 vs. PD 5500 vs. EN 13445.
  * CHOKE MANIFOLDS & BUFFER CHAMBERS (Buffer Tanks, Choke Lines, Manifold Headers):
    - Governing Codes: API Spec 16C (Choke & Kill Systems - Manifolds, Buffer Tanks, Articulated Lines) and ASME Section VIII Division 1 (Pressure Vessel body, Shell/Head calculations UG-27/32, Welding UW, U-Stamp) and API Spec 6A (PSL 2/3 Flanges & Hubs, Class DD/EE).
    - STRICT PROHIBITION: NEVER cite API 16AR for new manufacturing of choke manifolds, buffer chambers, or choke & kill lines! API 16AR is exclusively titled "Standard for Repair and Remanufacture of Drill-through Equipment" (BOPs, spools, adapters).
    - NEVER cite API 16AR Clause 5.1 (which is "Disassembly and Initial Inspection" of used equipment) for new manufacturing, design, or welding of buffer chambers!`;

if (!code.includes(promptTarget)) {
  console.error('promptTarget not found!');
  process.exit(1);
}
code = code.replace(promptTarget, promptInsert);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated worker/src/index.js');
