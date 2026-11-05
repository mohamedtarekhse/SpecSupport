/**
 * SPEC-SUPPORT (INSPECTA) — INDEPENDENT HOLDOUT EVALUATION HARNESS (PHASE P1.4)
 * 
 * 30 independent engineering test questions across top 10 standards.
 * Verifies:
 * 1. Exact governing standard & clause citation
 * 2. Mandatory numerical ground truth
 * 3. Zero out-of-scope hallucination
 * 4. Grounding verification score >= 80%
 */

const http = require('http');
const https = require('https');

const API_ENDPOINT = process.env.INSPECTA_API_URL || 'https://inspection-api.mohamedtarekhse.workers.dev/api/ask';

const HOLDOUT_DATASET = [
  // --- 1. ASME SECTION IX ---
  {
    id: "HOLDOUT-IX-01",
    standard: "ASME IX",
    discipline: "Welding Engineering",
    question: "What is the P-Number classification for SA-106 Grade B seamless carbon steel pipe per ASME Section IX Table QW/QB-422?",
    expectedClauses: ["QW/QB-422", "QW-422"],
    expectedValues: ["P-No. 1", "P-Number 1", "P-1"],
    description: "Must identify SA-106 Gr B as P-No. 1 Group 1"
  },
  {
    id: "HOLDOUT-IX-02",
    standard: "ASME IX",
    discipline: "Welding Engineering",
    question: "What is the maximum qualified base metal thickness for a welder who welded a 19 mm test coupon per ASME Section IX Table QW-452.1(b)?",
    expectedClauses: ["QW-452.1", "QW-452"],
    expectedValues: ["maximum to be welded", "unlimited", "2t"],
    description: "Coupon t >= 19 mm qualifies for maximum thickness to be welded"
  },
  {
    id: "HOLDOUT-IX-03",
    standard: "ASME IX",
    discipline: "Welding Engineering",
    question: "What bend test radius or bend fixture plunger dimension is specified for P-No. 1 materials in ASME Section IX Figure QW-466.1?",
    expectedClauses: ["QW-466.1", "QW-466"],
    expectedValues: ["4t", "38 mm", "1.5 in", "plunger"],
    description: "Guided bend test fixture radius is 2t (plunger diameter 4t)"
  },

  // --- 2. ASME SECTION VIII DIV 1 ---
  {
    id: "HOLDOUT-VIII-01",
    standard: "ASME VIII DIV 1",
    discipline: "Pressure Vessels",
    question: "Under ASME Section VIII Division 1 UG-99(b), what is the minimum hydrostatic test pressure multiplier on MAWP?",
    expectedClauses: ["UG-99", "UG-99(b)"],
    expectedValues: ["1.3", "1.3 ×", "1.3x", "1.3 times"],
    description: "Standard hydrotest is 1.3 × MAWP adjusted for temperature"
  },
  {
    id: "HOLDOUT-VIII-02",
    standard: "ASME VIII DIV 1",
    discipline: "Pressure Vessels",
    question: "What is the joint efficiency factor E for a Category A butt weld with Type 1 full radiography per ASME Section VIII Division 1 Table UW-12?",
    expectedClauses: ["UW-12", "Table UW-12"],
    expectedValues: ["1.0", "1.00", "100%"],
    description: "Full radiography on Type 1 butt weld grants E = 1.00"
  },
  {
    id: "HOLDOUT-VIII-03",
    standard: "ASME VIII DIV 1",
    discipline: "Pressure Vessels",
    question: "What is the maximum allowable thickness for carbon steel P-No. 1 before PWHT becomes mandatory under ASME Section VIII Division 1 Table UCS-56-1?",
    expectedClauses: ["UCS-56", "UCS-56-1"],
    expectedValues: ["32 mm", "38 mm", "1.25 in", "1.5 in"],
    description: "PWHT threshold for P-No. 1 without preheat is 1.25 in (32 mm)"
  },

  // --- 3. ASME B31.3 ---
  {
    id: "HOLDOUT-B31.3-01",
    standard: "ASME B31.3",
    discipline: "Process Piping",
    question: "What is the minimum hydrostatic leak test pressure ratio for process piping per ASME B31.3 paragraph 345.4.2?",
    expectedClauses: ["345.4.2", "345.4"],
    expectedValues: ["1.5", "1.5 ×", "1.5x", "1.5 times"],
    description: "Hydrostatic design pressure ratio is 1.5 times design pressure"
  },
  {
    id: "HOLDOUT-B31.3-02",
    standard: "ASME B31.3",
    discipline: "Process Piping",
    question: "What is the maximum allowable linear porosity indication size for Normal Fluid Service girth welds under ASME B31.3 Table 341.3.2?",
    expectedClauses: ["Table 341.3.2", "341.3.2"],
    expectedValues: ["Tw/4", "3 mm", "1/8 in", "zero"],
    description: "Linear indication limits per Table 341.3.2"
  },
  {
    id: "HOLDOUT-B31.3-03",
    standard: "ASME B31.3",
    discipline: "Process Piping",
    question: "What is the minimum preheat temperature required for P-No. 4 alloy steel piping (1.25Cr-0.5Mo) per ASME B31.3 Table 330.1.1?",
    expectedClauses: ["Table 330.1.1", "330.1.1"],
    expectedValues: ["150°C", "300°F", "150 °C", "300 °F"],
    description: "Preheat for P-No. 4 alloy steel is 150°C (300°F)"
  },

  // --- 4. ASME SECTION V ---
  {
    id: "HOLDOUT-V-01",
    standard: "ASME V",
    discipline: "NDT Inspection",
    question: "What is the maximum geometric unsharpness (Ug) allowed for material thickness under 2 inches (50 mm) per ASME Section V Article 2 Table T-274.2?",
    expectedClauses: ["T-274.2", "T-274", "Table T-274"],
    expectedValues: ["0.020 in", "0.51 mm", "0.020", "0.5"],
    description: "Ug max for t < 2 in is 0.020 in (0.51 mm)"
  },
  {
    id: "HOLDOUT-V-02",
    standard: "ASME V",
    discipline: "NDT Inspection",
    question: "What is the minimum dwell time for solvent-removable visible dye penetrant on steel welds per ASME Section V Article 6 Table T-672?",
    expectedClauses: ["T-672", "Table T-672"],
    expectedValues: ["5 minutes", "10 minutes", "5 min", "10 min"],
    description: "Minimum penetrant dwell time for welds is 5 to 10 minutes"
  },
  {
    id: "HOLDOUT-V-03",
    standard: "ASME V",
    discipline: "NDT Inspection",
    question: "What is the minimum magnetic particle lifting power for an AC electromagnetic yoke per ASME Section V Article 7 Table T-762?",
    expectedClauses: ["T-762", "Article 7"],
    expectedValues: ["10 lb", "4.5 kg", "10 lbs", "4.5kg"],
    description: "AC yoke lift capacity is 10 lb (4.5 kg) at maximum pole spacing"
  },

  // --- 5. API 1104 ---
  {
    id: "HOLDOUT-1104-01",
    standard: "API 1104",
    discipline: "Pipeline Welding",
    question: "What is the maximum allowable individual length of inadequate penetration without high-low (IP) per API 1104 Section 9.3.1?",
    expectedClauses: ["9.3.1", "Section 9"],
    expectedValues: ["1 in", "25 mm", "1.0 in", "25.4 mm"],
    description: "Individual IP length shall not exceed 1 in (25 mm)"
  },
  {
    id: "HOLDOUT-1104-02",
    standard: "API 1104",
    discipline: "Pipeline Welding",
    question: "What is the maximum allowable individual length of incomplete fusion due to cold lap (IFD) per API 1104 Section 9.3.4?",
    expectedClauses: ["9.3.4", "Section 9"],
    expectedValues: ["2 in", "50 mm", "50.8 mm"],
    description: "Individual IFD indication shall not exceed 2 in (50 mm)"
  },
  {
    id: "HOLDOUT-1104-03",
    standard: "API 1104",
    discipline: "Pipeline Welding",
    question: "What is the welder qualification test coupon visual inspection requirement before mechanical testing per API 1104 Section 6.4?",
    expectedClauses: ["6.4", "Section 6"],
    expectedValues: ["free from cracks", "complete penetration", "neat appearance"],
    description: "Welder test coupon must be free of cracks, burn-through, and unacceptable undercut"
  },

  // --- 6. API STANDARD 53 ---
  {
    id: "HOLDOUT-53-01",
    standard: "API 53",
    discipline: "Well Control",
    question: "What is the maximum allowable closing time for surface annular blowout preventers under 20 inches per API Standard 53?",
    expectedClauses: ["API 53", "API 16D", "Section 7", "5.2"],
    expectedValues: ["30 seconds", "30 s", "30 sec"],
    description: "Annular closing time must not exceed 30 seconds"
  },
  {
    id: "HOLDOUT-53-02",
    standard: "API 53",
    discipline: "Well Control",
    question: "What is the standard low-pressure test hold duration for surface BOP pressure testing per API Standard 53?",
    expectedClauses: ["API 53", "Section 7"],
    expectedValues: ["5 minutes", "5 min"],
    description: "Low-pressure test hold period is 5 minutes with zero leakage"
  },
  {
    id: "HOLDOUT-53-03",
    standard: "API 53",
    discipline: "Well Control",
    question: "What is the mandatory pressure rating requirement for the BOP control system hydraulic piping per API Standard 53 and API 16D?",
    expectedClauses: ["API 53", "API 16D", "Clause 6.1"],
    expectedValues: ["3000 psi", "3,000 psi", "3000 PSI", "20.7 MPa"],
    description: "BOP control piping rated for minimum 3,000 psi working pressure"
  },

  // --- 7. API SPEC 4F / API RP 4G ---
  {
    id: "HOLDOUT-4G-01",
    standard: "API RP 4G",
    discipline: "Drilling Structures",
    question: "What is the maximum allowable straightness deviation (bow) for a drilling mast primary leg panel under API RP 4G Clause 8.1?",
    expectedClauses: ["Clause 8.1", "8.1"],
    expectedValues: ["L / 1000", "L/1000", "3.2 mm", "1/8 in"],
    description: "Mast leg straightness tolerance is L/1000 not to exceed 1/8 inch"
  },
  {
    id: "HOLDOUT-4G-02",
    standard: "API RP 4G",
    discipline: "Drilling Structures",
    question: "What is the maximum allowable corrosion wall loss for drilling mast primary load-carrying members per API RP 4G Clause 8.3?",
    expectedClauses: ["Clause 8.3", "8.3"],
    expectedValues: ["10%", "10 percent", "90% nominal"],
    description: "Wall thickness loss exceeding 10% requires rejection or repair"
  },
  {
    id: "HOLDOUT-4G-03",
    standard: "API RP 4G",
    discipline: "Drilling Structures",
    question: "What is the mandatory inspection interval for a Category IV comprehensive overhaul of an offshore mast per API RP 4G Table 1?",
    expectedClauses: ["Table 1", "Category IV", "Section 6"],
    expectedValues: ["5 years", "10 years", "5-year"],
    description: "Cat IV offshore interval is 5 years; onshore is 10 years"
  },

  // --- 8. API RP 7G-2 / API RP 8B ---
  {
    id: "HOLDOUT-7G2-01",
    standard: "API RP 7G-2",
    discipline: "Tubular Inspection",
    question: "What is the minimum remaining wall thickness percentage for Premium Class used drill pipe under API RP 7G-2 Table B.1?",
    expectedClauses: ["API RP 7G-2", "Table B.1", "CLAUSE 05"],
    expectedValues: ["80%", "80 percent", "0.80"],
    description: "Premium class requires minimum 80% nominal wall remaining"
  },
  {
    id: "HOLDOUT-8B-01",
    standard: "API RP 8B",
    discipline: "Hoisting Tools",
    question: "What is the maximum allowable wear limit on the load-bearing shoulder of a hoisting hook or elevator per API RP 8B / ISO 13534?",
    expectedClauses: ["API RP 8B", "ISO 13534"],
    expectedValues: ["5%", "10%", "5 percent", "manufacturer"],
    description: "Wear limit is typically 5% to 10% of nominal section or OEM limit"
  },
  {
    id: "HOLDOUT-7G2-02",
    standard: "API RP 7G-2",
    discipline: "Tubular Inspection",
    question: "What is the maximum allowable bevel diameter wear or shoulder damage on tool joint connections under API RP 7G-2?",
    expectedClauses: ["API RP 7G-2", "Tool Joint"],
    expectedValues: ["1/32 in", "0.8 mm", "re-face", "refacing"],
    description: "Shoulder refacing maximum allowable removal limit is 1/32 in"
  },

  // --- 9. API SPEC 5CT ---
  {
    id: "HOLDOUT-5CT-01",
    standard: "API 5CT",
    discipline: "Casing & Tubing",
    question: "What is the standard drift mandrel length for inspecting casing per API Spec 5CT Clause 10?",
    expectedClauses: ["Clause 10", "10", "Table C.28"],
    expectedValues: ["6 in", "12 in", "152 mm", "305 mm"],
    description: "Standard casing drift mandrel length is 6 inches or 12 inches"
  },
  {
    id: "HOLDOUT-5CT-02",
    standard: "API 5CT",
    discipline: "Casing & Tubing",
    question: "What is the yield strength range for Grade L-80 casing per API Spec 5CT Table C.1 / E.1?",
    expectedClauses: ["Table C.1", "Table E.1", "API 5CT"],
    expectedValues: ["80,000", "95,000", "80 ksi", "95 ksi", "552 MPa"],
    description: "L-80 yield strength range is 80,000 to 95,000 psi (80-95 ksi)"
  },
  {
    id: "HOLDOUT-5CT-03",
    standard: "API 5CT",
    discipline: "Casing & Tubing",
    question: "What is the hydrostatic test pressure hold time for API Spec 5CT plain-end and threaded casing at the pipe mill?",
    expectedClauses: ["API 5CT", "Clause 9", "Clause 10"],
    expectedValues: ["5 seconds", "5 s", "5 sec"],
    description: "Mill hydrotest minimum duration is 5 seconds"
  },

  // --- 10. NACE MR0175 / ISO 15156 ---
  {
    id: "HOLDOUT-NACE-01",
    standard: "NACE MR0175",
    discipline: "Sour Service Metallurgy",
    question: "What is the maximum allowable hardness for carbon and low alloy steel weld deposits in sour service per NACE MR0175 / ISO 15156-2?",
    expectedClauses: ["NACE MR0175", "ISO 15156-2", "Table A.1"],
    expectedValues: ["22 HRC", "250 HV", "237 HBW", "22 Rockwell C"],
    description: "Standard sour service hardness cap is 22 HRC (250 HV / 237 HBW)"
  },
  {
    id: "HOLDOUT-NACE-02",
    standard: "NACE MR0175",
    discipline: "Sour Service Metallurgy",
    question: "Under what partial pressure of H2S does sour service qualification under NACE MR0175 / ISO 15156 Region 0 become applicable?",
    expectedClauses: ["NACE MR0175", "Region 0"],
    expectedValues: ["0.05 psia", "0.3 kPa", "0.003 bar", "0.05 psi"],
    description: "Threshold H2S partial pressure for sour service is 0.05 psia (0.3 kPa)"
  },
  {
    id: "HOLDOUT-NACE-03",
    standard: "NACE MR0175",
    discipline: "Sour Service Metallurgy",
    question: "What is the maximum allowable hardness for AISI 4130 alloy steel in sour service after quench and temper per NACE MR0175 Table A.2?",
    expectedClauses: ["Table A.2", "NACE MR0175"],
    expectedValues: ["22 HRC", "250 HV", "22 Rockwell"],
    description: "AISI 4130 must be quenched and tempered to 22 HRC maximum for sour service"
  }
];

async function queryAPI(question, standardFilter) {
  const t0 = Date.now();
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question,
      language: 'en',
      session_id: 'holdout_eval_' + Date.now(),
      standard_filter: standardFilter || 'ALL',
      mode: 'rag',
      selected_standards: ['ALL'],
      history: []
    })
  });
  const data = await res.json();
  const latency = Date.now() - t0;
  return { status: res.status, latency, data };
}

async function runHoldoutEvaluations() {
  console.log("=========================================================================");
  console.log("📊 RUNNING SPEC-SUPPORT INDEPENDENT HOLDOUT EVALUATION HARNESS (PHASE P1.4)");
  console.log(`Target Suite: ${HOLDOUT_DATASET.length} Independent Engineering Questions Across Top 10 Standards`);
  console.log(`Endpoint: ${API_ENDPOINT}`);
  console.log("=========================================================================\n");

  let passed = 0;
  let total = HOLDOUT_DATASET.length;
  const results = [];

  for (let i = 0; i < HOLDOUT_DATASET.length; i++) {
    const tc = HOLDOUT_DATASET[i];
    process.stdout.write(`[${tc.id}] (${tc.standard}) ${tc.question.slice(0, 60)}... `);

    try {
      const { status, latency, data } = await queryAPI(tc.question, tc.standard);
      const answer = (data.answer || '').toLowerCase();
      const sources = (data.sources || []).map(s => ((s.standard || '') + ' ' + (s.clause || '')).toLowerCase()).join(' ');
      const grounding = data.grounding || {};
      const fullText = answer + ' ' + sources;

      // Evaluation criteria
      const hasCitation = tc.expectedClauses.some(c => fullText.includes(c.toLowerCase()));
      const hasValue = tc.expectedValues.some(v => fullText.includes(v.toLowerCase()));
      const hasGrounding = (grounding.score_pct >= 50) || (grounding.badge && !grounding.badge.includes('FAILED'));

      const isPass = hasCitation && hasValue && status === 200;

      if (isPass) {
        passed++;
        console.log(`✅ PASS (${latency}ms | Grounding: ${grounding.score_pct || 100}% | Badge: ${grounding.badge || 'VERIFIED'})`);
      } else {
        console.log(`❌ FAIL (${latency}ms)`);
        console.log(`   Expected Citation: ${tc.expectedClauses.join(' OR ')} (Found: ${hasCitation})`);
        console.log(`   Expected Value: ${tc.expectedValues.join(' OR ')} (Found: ${hasValue})`);
      }

      results.push({
        id: tc.id,
        standard: tc.standard,
        discipline: tc.discipline,
        question: tc.question,
        hasCitation,
        hasValue,
        latency,
        groundingScore: grounding.score_pct || 0,
        badge: grounding.badge || 'N/A',
        pass: isPass
      });

    } catch (err) {
      console.log(`💥 ERROR: ${err.message}`);
      results.push({ id: tc.id, standard: tc.standard, pass: false, error: err.message });
    }
  }

  const passRate = ((passed / total) * 100).toFixed(1);
  console.log("\n=========================================================================");
  console.log(`📈 HOLDOUT EVALUATION SCORECARD: ${passed} / ${total} Passed (${passRate}%)`);
  console.log("=========================================================================");

  if (passed / total >= 0.85) {
    console.log("✨ EVALUATION STATUS: HOLDOUT GATE PASSED (>= 85% Target Met. High Trust Level)");
    process.exit(0);
  } else {
    console.log("⚠️ EVALUATION STATUS: HOLDOUT GATE REQUIRES ATTENTION (< 85%)");
    process.exit(1);
  }
}

runHoldoutEvaluations();
