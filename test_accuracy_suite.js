const fetch = globalThis.fetch || require('node-fetch');

const TEST_CASES = [
  {
    id: 1,
    name: "Pulsation Dampener Shell Thickness (ASME VIII / API 7K)",
    question: "minimum wall thickness for pulsation dampner 27 inch diameter and 5000 psi k20 hydrill",
    assertions: [
      { desc: "Cites ASME Section VIII Division 1 UG-27(d) or API 7K", test: (ans) => /UG-27\(d\)|ASME.*VIII/i.test(ans) },
      { desc: "Provides numerical wall thickness ~1.53 in (39 mm)", test: (ans) => /1\.53|38\.9|39\.0/i.test(ans) },
      { desc: "Explicit acceptance criteria (>= 1.534 in)", test: (ans) => /accept/i.test(ans) && />=|greater|exceed/i.test(ans) },
      { desc: "Explicit rejection criteria (< 1.534 in)", test: (ans) => /reject|condemn/i.test(ans) },
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
      { desc: "Explicit rejection of any detectable undercut", test: (ans) => /reject/i.test(ans) }
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
        const ok = a.test(answer);
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
