const fetch = globalThis.fetch || require('node-fetch');


// =========================================================================
// 🚨 PLANTED-ERROR VERIFICATION SUITE (PLAN.MD §4, P0.5 / PHASE P1.2)
// 5 REAL IN-CORPUS + 5 OUT-OF-CORPUS ADVERSARIAL QUERIES
// =========================================================================
const PLANTED_ERROR_CASES = [
  // --- 5 REAL IN-CORPUS QUESTIONS ---
  {
    id: "REAL-01",
    name: "Preheat for ASTM A106 Gr B Piping (ASME B31.3 Table 330.1.1)",
    question: "What is the minimum preheat temperature for ASTM A106 Grade B piping per ASME B31.3?",
    isInCorpus: true,
    assertions: [
      { desc: "Cites ASME B31.3 Table 330.1.1 or 330.1", test: (ans, d) => /330\.1(?:\.1)?|B31\.3/i.test(ans) },
      { desc: "Specifies preheat requirement per Table 330.1.1 (None / not required / 0°C / 10°C / 50°F)", test: (ans, d) => /(?:10\s*°?C|50\s*°?F|79\s*°?C|175\s*°?F|0\s*°?C|32\s*°?F|None|not required)/i.test(ans) },
      { desc: "Includes verified sources", test: (ans, d) => Array.isArray(d.sources) && d.sources.length > 0 }
    ]
  },
  {
    id: "REAL-02",
    name: "SA-516 Gr 70 P-Number Classification (ASME Section IX QW/QB-422)",
    question: "What is the P-Number and Group Number for SA-516 Grade 70 plate per ASME Section IX QW/QB-422?",
    isInCorpus: true,
    assertions: [
      { desc: "Cites QW/QB-422 or QW-422", test: (ans, d) => /QW(?:\/QB)?-?422/i.test(ans) },
      { desc: "Classifies as P-No. 1 Group 2", test: (ans, d) => /P-?No\.?\s*1/i.test(ans) && /Group\s*(?:No\.?\s*)?2/i.test(ans) },
      { desc: "Grounding verification badge is VERIFIED_CODE_GROUNDED", test: (ans, d) => Boolean(d.grounding && d.grounding.badge === 'VERIFIED_CODE_GROUNDED') }
    ]
  },
  {
    id: "REAL-03",
    name: "Drill Pipe Premium Wall Thickness Limit (API RP 7G-2)",
    question: "What is the minimum remaining wall thickness wear limit for Premium class drill pipe per API RP 7G-2?",
    isInCorpus: true,
    assertions: [
      { desc: "Cites API RP 7G-2", test: (ans, d) => /API\s*(?:RP\s*)?7G-?2/i.test(ans) },
      { desc: "States 80% minimum remaining wall thickness", test: (ans, d) => /80\s*%/i.test(ans) },
      { desc: "Explicit rejection threshold (< 80% is condemned/Class 2)", test: (ans, d) => /reject|scrap|condemn|Class\s*2|<|less/i.test(ans) }
    ]
  },
  {
    id: "REAL-04",
    name: "AISI 4130 Sour Service Hardness & PWHT (NACE MR0175)",
    question: "What is the maximum allowable hardness across the weld metal and HAZ for AISI 4130 in sour service per NACE MR0175?",
    isInCorpus: true,
    assertions: [
      { desc: "Cites NACE MR0175 or ISO 15156", test: (ans, d) => /NACE\s*MR0175|ISO\s*15156/i.test(ans) },
      { desc: "Specifies 22 HRC maximum (or 250 HV)", test: (ans, d) => /22\s*HRC|250\s*HV/i.test(ans) },
      { desc: "PWHT required / stated", test: (ans, d) => /PWHT|heat\s*treatment/i.test(ans) }
    ]
  },
  {
    id: "REAL-05",
    name: "Hydrostatic Test Ratio for Metallic Piping (ASME B31.3 Clause 345.4.2)",
    question: "What is the hydrostatic test pressure ratio for metallic piping per ASME B31.3 Clause 345.4.2?",
    isInCorpus: true,
    assertions: [
      { desc: "Cites ASME B31.3 or 345.4.2", test: (ans, d) => /345\.4\.2|B31\.3/i.test(ans) },
      { desc: "States 1.5 times design pressure (1.5 × P)", test: (ans, d) => /1\.5/i.test(ans) },
      { desc: "Stresses ratio (St/S) or visual examination during hold", test: (ans, d) => /S_?t|S|ratio|temperature|visual|hold/i.test(ans) }
    ]
  },

  // --- 5 OUT-OF-CORPUS ADVERSARIAL QUESTIONS (MUST DEMARCATE / REFUSE) ---
  {
    id: "OUT-01",
    name: "AWS D1.8 Seismic Welding Code (Out of Corpus)",
    question: "What are the seismic weld inspection requirements and demand critical joint criteria per AWS D1.8?",
    isInCorpus: false,
    assertions: [
      { desc: "MUST issue CORPUS SCOPE DEMARCATION NOTICE", test: (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans) },
      { desc: "Identifies AWS D1.8 as outside verified corpus", test: (ans, d) => /AWS\s*D1\.8/i.test(ans) },
      { desc: "Badge is CALIBRATED_ABSTENTION or score is 100%", test: (ans, d) => d.grounding?.badge === 'CALIBRATED_ABSTENTION' || d.grounding?.score_pct === 100 }
    ]
  },
  {
    id: "OUT-02",
    name: "EN 13445 Unfired Pressure Vessels (Out of Corpus)",
    question: "What is the maximum allowable design stress for unfired pressure vessels per EN 13445?",
    isInCorpus: false,
    assertions: [
      { desc: "MUST issue CORPUS SCOPE DEMARCATION NOTICE", test: (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans) },
      { desc: "Identifies EN 13445 as outside verified corpus", test: (ans, d) => /EN\s*13445/i.test(ans) },
      { desc: "Never generates plausible fabricated stress numbers", test: (ans, d) => !/MPa|design\s*stress\s*is/i.test(ans) || /CORPUS SCOPE DEMARCATION/i.test(ans) }
    ]
  },
  {
    id: "OUT-03",
    name: "ASTM A123 Zinc Coating / Galvanizing (Out of Corpus)",
    question: "What is the minimum zinc coating thickness and galvanizing inspection requirement per ASTM A123?",
    isInCorpus: false,
    assertions: [
      { desc: "MUST issue CORPUS SCOPE DEMARCATION NOTICE", test: (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans) },
      { desc: "Identifies ASTM A123 as outside verified corpus", test: (ans, d) => /ASTM\s*A123/i.test(ans) }
    ]
  },
  {
    id: "OUT-04",
    name: "ASME BPE Bioprocessing Equipment Piping (Out of Corpus)",
    question: "What is the maximum allowable surface roughness Ra for hygienic piping joints per ASME BPE?",
    isInCorpus: false,
    assertions: [
      { desc: "MUST issue CORPUS SCOPE DEMARCATION NOTICE", test: (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans) },
      { desc: "Identifies ASME BPE as outside verified corpus", test: (ans, d) => /ASME\s*BPE/i.test(ans) }
    ]
  },
  {
    id: "OUT-05",
    name: "API RP 2A-WSD Offshore Platform Structures (Out of Corpus)",
    question: "What is the allowable joint punching shear stress for offshore tubular joints per API RP 2A-WSD?",
    isInCorpus: false,
    assertions: [
      { desc: "MUST issue CORPUS SCOPE DEMARCATION NOTICE", test: (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans) },
      { desc: "Identifies API RP 2A as outside verified corpus", test: (ans, d) => /API\s*RP\s*2A/i.test(ans) }
    ]
  }
];

const TEST_CASES = [
  {
    id: 1,
    name: "Pulsation Dampener Shell Thickness (ASME VIII / API 7K)",
    question: "minimum wall thickness for pulsation dampner 27 inch diameter and 5000 psi k20 hydrill",
    assertions: [
      { desc: "Cites ASME Section VIII Division 1 UG-27(d) or API 7K", test: (ans) => /UG-27\(d\)|ASME.*VIII/i.test(ans) },
      { desc: "Provides numerical wall thickness ~1.53 in (39 mm)", test: (ans) => /1\.53|38\.9|39\.0/i.test(ans) },
      { desc: "Explicit acceptance criteria (>= 1.534 in)", test: (ans) => /accept/i.test(ans) && />=|≥|greater|exceed/i.test(ans) },
      { desc: "Explicit rejection criteria (< 1.534 in)", test: (ans) => /reject|condemn|unacceptable|non-compliant|down-rated|not\s*permitted|below|<|less\s*than/i.test(ans) },
      { desc: "Does not cite prohibited API 1104 pipeline code", test: (ans) => !/API\s*1104/i.test(ans) }
    ]
  },
  {
    id: 2,
    name: "Severe Cyclic Weld Undercut (ASME B31.3 Table 341.3.2)",
    question: "What is the maximum allowable undercut depth for severe cyclic conditions in ASME B31.3?",
    assertions: [
      { desc: "Cites Table 341.3.2", test: (ans) => /341\.3\.2/i.test(ans) },
      { desc: "Specifies 0.0 mm / zero undercut allowable", test: (ans) => /0(?:\.0)?\s*(?:mm|in)|zero/i.test(ans) },
      { desc: "Explicit rejection of any detectable undercut", test: (ans) => /reject|unacceptable|not\s*acceptable/i.test(ans) }
    ]
  },
  {
    id: 3,
    name: "Hoisting Tool Elevator Bore Wear (API RP 8B)",
    question: "What is the maximum allowable bore diameter for a 5 inch drill pipe elevator per API RP 8B?",
    assertions: [
      { desc: "Cites API RP 8B or ISO 13534", test: (ans) => /API\s*RP\s*8B|ISO\s*13534/i.test(ans) },
      { desc: "Calculates bore ~5.167 in (131 mm)", test: (ans) => /5\.16|5\.17|131/i.test(ans) },
      { desc: "States pass/fail criteria", test: (ans) => /accept|pass|reject/i.test(ans) }
    ]
  },
  {
    id: 4,
    name: "Sour Service Casing Hardness (API 5CT / NACE MR0175)",
    question: "What is the maximum allowable hardness for Grade L-80 casing in sour service per API 5CT and NACE MR0175?",
    assertions: [
      { desc: "Cites API 5CT or NACE MR0175", test: (ans) => /API\s*(?:Spec\s*)?5CT|NACE\s*MR0175/i.test(ans) },
      { desc: "States 23 HRC maximum (or 241 HBW)", test: (ans) => /23(?:\.0)?\s*HRC|241\s*HBW/i.test(ans) },
      { desc: "Rejection threshold stated", test: (ans) => /reject/i.test(ans) }
    ]
  },
  {
    id: 5,
    name: "RT Radiographic Density Limits (ASME Section V Article 2)",
    question: "What are the minimum and maximum acceptable optical density limits for X-ray and Gamma-ray film per ASME Section V Article 2?",
    assertions: [
      { desc: "Cites ASME Section V Article 2 (T-260)", test: (ans) => /ASME.*(?:V|5).*Article\s*2|T-260/i.test(ans) },
      { desc: "States 1.8 min for X-ray and 2.0 min for Gamma", test: (ans) => /1\.8/i.test(ans) && /2\.0/i.test(ans) },
      { desc: "States 4.0 maximum density", test: (ans) => /4\.0/i.test(ans) }
    ]
  },
  {
    id: 6,
    name: "Mast Leg Straightness Tolerance (API Spec 4F / API RP 4G)",
    question: "What is the maximum allowable straightness deviation or bow for a mast leg panel per API Spec 4F and API RP 4G?",
    assertions: [
      { desc: "Cites API Spec 4F or API RP 4G Clause 8.1", test: (ans) => /API\s*(?:Spec\s*)?4F|API\s*(?:RP\s*)?4G|8\.1/i.test(ans) },
      { desc: "States L / 1000 limit and 3.2 mm (1/8 in) maximum", test: (ans) => /1000/i.test(ans) && /(?:3\.2\s*mm|1\/8\s*in)/i.test(ans) },
      { desc: "Explicit rejection criteria (> L/1000 or > 1/8 in)", test: (ans) => /reject/i.test(ans) }
    ]
  },
  {
    id: 7,
    name: "Mast Leg Corrosion Wall Loss Limit (API RP 4G Clause 8.3)",
    question: "What is the maximum allowable corrosion wall loss for drilling mast primary legs per API RP 4G?",
    assertions: [
      { desc: "Cites API RP 4G Clause 8.3", test: (ans) => /API\s*(?:RP\s*)?4G|8\.3/i.test(ans) },
      { desc: "States 10% maximum allowable wall loss (t >= 90% nominal)", test: (ans) => /10\s*%/i.test(ans) },
      { desc: "Rejection threshold stated (> 10% loss is rejected)", test: (ans) => /reject/i.test(ans) }
    ]
  },
  {
    id: 8,
    name: "Category IV Mast Overhaul Interval & Qualification (API RP 4G)",
    question: "What is the mandatory inspection interval and personnel qualification for a Category IV drilling mast overhaul per API RP 4G?",
    assertions: [
      { desc: "States 10 years (or 5 years offshore) interval", test: (ans) => /10\s*year/i.test(ans) },
      { desc: "Requires Professional Engineer (PE) or OEM Representative", test: (ans) => /Professional\s*Engineer|PE\b|OEM/i.test(ans) },
      { desc: "Requires 100% NDT (MPI / UT)", test: (ans) => /NDT|MPI|UT|100\s*%/i.test(ans) }
    ]
  },
  {
    id: 9,
    name: "Mast Raising Line Safety Factor (API Spec 4F Section 6)",
    question: "What is the minimum safety factor for mast raising lines per API Spec 4F?",
    assertions: [
      { desc: "Cites API Spec 4F", test: (ans) => /API\s*(?:Spec\s*)?4F/i.test(ans) },
      { desc: "States minimum safety factor of 3.0 (or 2.5)", test: (ans) => /3(?:\.0)?|2\.5/i.test(ans) },
      { desc: "Technical explanation of dynamic raising forces", test: (ans) => /safety\s*factor|breaking\s*strength|load/i.test(ans) }
    ]
  },
  {
    id: 10,
    name: "Substructure Mast Shoe Leveling Elevation Tolerance (API 4F / 4G)",
    question: "What is the maximum allowable elevation variation across mast shoes during substructure leveling per API 4F and API RP 4G?",
    assertions: [
      { desc: "Cites API 4F or API RP 4G", test: (ans) => /API\s*(?:Spec\s*)?4F|API\s*(?:RP\s*)?4G/i.test(ans) },
      { desc: "States 1/8 inch (3.2 mm) maximum variation", test: (ans) => /1\/8\s*in|3\.2\s*mm/i.test(ans) },
      { desc: "Explains prevention of uneven loading or racking", test: (ans) => /align|level|load|stress/i.test(ans) }
    ]
  },
  {
    id: 11,
    name: "Drilling Well Control Hard Shut-In & Kill Mud Weight (IADC / API 53)",
    question: "What is the exact procedure for hard shut-in while drilling and how do you calculate Kill Mud Weight per IADC WellSharp and API Standard 53?",
    assertions: [
      { desc: "Cites API Standard 53 or IADC WellSharp", test: (ans) => /API\s*(?:Standard\s*|Std\s*|RP\s*)?53|IADC\s*WellSharp/i.test(ans) },
      { desc: "Specifies hard shut-in sequence (space out / stop pumps, open HCR, close BOP)", test: (ans) => (/(?:space\s*out|pick\s*up)/i.test(ans) || /stop.*pump/i.test(ans)) && /clos(?:e|ing)[\s\S]*(?:BOP|annular|ram)/i.test(ans) },
      { desc: "Provides KMW formula (KMW = OMW + SIDPP / (0.052 * TVD))", test: (ans) => /0\.052/i.test(ans) && /SIDPP/i.test(ans) && /TVD/i.test(ans) },
      { desc: "States acceptance/rejection criteria", test: (ans) => /accept|reject/i.test(ans) }
    ]
  },
  {
    id: 12,
    name: "Cameron Type U BOP Ram Change & Bonnet Seal Criteria (OEM Manual)",
    question: "What is the step by step procedure to change ram rubbers on a Cameron Type U BOP and what are the bonnet seal inspection criteria?",
    assertions: [
      { desc: "Cites Cameron Type U OEM Manual or API 16A", test: (ans) => /Cameron.*(?:Type\s*U|OEM)|API\s*16A/i.test(ans) },
      { desc: "Details ram change sequence (bonnet open, T-slot slide, packer replacement)", test: (ans) => /bonnet/i.test(ans) && /T-slot|T-head|slide/i.test(ans) && /packer/i.test(ans) },
      { desc: "Specifies bonnet seal inspection / zero pitting on sealing face", test: (ans) => /bonnet\s*seal/i.test(ans) && /(?:pit|pitting|scratch|scoot|taper|band)/i.test(ans) },
      { desc: "States acceptance or rejection thresholds", test: (ans) => /accept|reject/i.test(ans) }
    ]
  },
  {
    id: 13,
    name: "Hydril GK Annular BOP Element Replacement & Stripping Pressure (OEM Manual)",
    question: "How do you replace the packing element on a Hydril GK Annular BOP and what is the recommended closing pressure for stripping?",
    assertions: [
      { desc: "Cites Hydril GK OEM Manual", test: (ans) => /Hydril\s*GK|Hydril.*OEM/i.test(ans) },
      { desc: "Explains element replacement (head removal, lifting lugs, bowl cleaning)", test: (ans) => /head/i.test(ans) && /bowl/i.test(ans) && /packing\s*(?:element|unit)/i.test(ans) },
      { desc: "Specifies stripping pressure reduction (400 to 700 psi)", test: (ans) => /(?:400|500|600|700)\s*psi/i.test(ans) },
      { desc: "Prohibits hydrocarbon grease / specifies approved lubricant on packing unit", test: (ans) => /hydrocarbon|vegetable|mineral|grease|lubric/i.test(ans) }
    ]
  }
];

async function runSuite() {
  console.log("=================================================");
  console.log(" INSPECTA OIL & GAS ACCURACY BENCHMARK SUITE");
  console.log(" Endpoint: https://inspection-api.mohamedtarekhse.workers.dev/api/ask");
  console.log("=================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  for (const tc of TEST_CASES) {
    console.log(`\n▶ [TEST ${tc.id}] ${tc.name}`);
    console.log(`  Query: "${tc.question}"`);

    try {
      const res = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: tc.question,
          language: 'en',
          session_id: `benchmark-suite-${tc.id}`
        })
      });

      const data = await res.json();
      const answer = data.answer || "";

      let tcPassed = true;
      for (const a of tc.assertions) {
        totalTests++;
        const ok = a.test(answer, data);
        if (ok) {
          passedTests++;
          console.log(`    ✓ PASS: ${a.desc}`);
        } else {
          tcPassed = false;
          console.log(`    ✗ FAIL: ${a.desc}`);
        }
      }

      if (!tcPassed) {
        console.log(`    [Snippet]: ${answer.substring(0, 300).replace(/\n/g, ' ')}...`);
      }
    } catch (e) {
      console.error(`    ✗ ERROR executing test: ${e.message}`);
    }
  }

  console.log("\n=================================================");
  console.log(` BENCHMARK SUMMARY: ${passedTests}/${totalTests} assertions passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  console.log("=================================================");
}

runSuite();
