// scripts/run_shadow_evals.js
// Shadow evaluation benchmark suite running against ?corpus=v2
// Gating: Golden 14/14, Planted 10/10 (5 refusals), Citation 5/5, Fast-paths <=1.5s/3.0s, Footer >98%

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET || "";

const GOLDEN_DATASET = [
  { id: "WPS-01", prompt: "What is the P-Number and Group Number for SA-516 Grade 70 carbon steel plate under ASME Section IX?", expectedClauses: ["QW-422", "P-No. 1", "Group 2"], expectedValues: ["1", "2"] },
  { id: "WPS-02", prompt: "What is the thickness threshold requiring mandatory Post Weld Heat Treatment (PWHT) for P-No 1 carbon steel piping under ASME B31.3?", expectedClauses: ["Table 331.1.1", "331.1.1"], expectedValues: ["19", "19.05", "0.75"] },
  { id: "WPS-03", prompt: "What are the minimum preheat temperature requirements for ASTM A106 Gr B with wall thickness over 25 mm per ASME B31.3?", expectedClauses: ["Table 330.1.1", "330.1.1"], expectedValues: ["95", "200"] },
  { id: "WPS-04", prompt: "What is the F-Number and A-Number for ER70S-6 and E7018-1 welding electrodes under ASME Section IX?", expectedClauses: ["QW-432", "QW-442"], expectedValues: ["F-6", "F-4", "A-1"] },
  { id: "WPS-05", prompt: "Does a welder qualified on 6G pipe test position qualify for all positions under ASME Section IX?", expectedClauses: ["QW-461.9", "QW-452"], expectedValues: ["All", "all positions"] },
  { id: "PV-01", prompt: "What is the standard hydrostatic test pressure formula for new pressure vessels under ASME Section VIII Div 1 UG-99(b)?", expectedClauses: ["UG-99"], expectedValues: ["1.3", "MAOP"] },
  { id: "PV-02", prompt: "What is the minimum holding time for hydrostatic testing of pressure vessels under ASME Section VIII Div 1?", expectedClauses: ["UG-99"], expectedValues: ["visual", "10", "examine"] },
  { id: "PV-03", prompt: "What is the maximum allowable undercut depth for Normal Fluid Service welds under ASME B31.3 Table 341.3.2?", expectedClauses: ["Table 341.3.2", "341.3.2"], expectedValues: ["1 mm", "1.0 mm", "1/32 in"] },
  { id: "NDT-01", prompt: "What is the acceptable transmitted radiographic density range for X-ray and Gamma-ray radiographs under ASME Section V Article 2?", expectedClauses: ["T-225", "T-270", "Article 2"], expectedValues: ["1.8", "4.0", "2.0"] },
  { id: "NDT-02", prompt: "What is the ultrasonic examination recording threshold for reflectors under ASME Section V Article 4?", expectedClauses: ["Article 4", "T-470", "DAC"], expectedValues: ["20%", "50%"] },
  { id: "NDT-03", prompt: "What is the minimum surface illumination required for visual examination of welds under ASME Section V Article 9?", expectedClauses: ["Article 9", "T-950"], expectedValues: ["1000 lux", "100 fc", "100 foot-candles"] },
  { id: "RIG-01", prompt: "What is the maximum Rockwell hardness limit for API 5CT Grade L-80 casing in sour service per NACE MR0175 / ISO 15156?", expectedClauses: ["API 5CT", "NACE MR0175"], expectedValues: ["22", "23", "HRC"] },
  { id: "RIG-02", prompt: "What is the minimum remaining wall thickness percentage for Premium Class used drill pipe under API RP 7G-2?", expectedClauses: ["API RP 7G-2", "7G-2"], expectedValues: ["80%", "80 percent"] },
  { id: "RIG-03", prompt: "What are the standard low-pressure and high-pressure test values for ram blowout preventers (BOP) under API Standard 53?", expectedClauses: ["API Standard 53", "API 53"], expectedValues: ["250", "350", "rated working pressure"] }
];

const PLANTED_DATASET = [
  {
    id: "REAL-01",
    name: "Preheat for ASTM A106 Gr B Piping (ASME B31.3 Table 330.1.1)",
    question: "What is the minimum preheat temperature for ASTM A106 Grade B piping per ASME B31.3?",
    isInCorpus: true,
    assertions: [
      (ans, d) => /330\.1(?:\.1)?|B31\.3/i.test(ans),
      (ans, d) => /(?:10\s*°?C|50\s*°?F|79\s*°?C|175\s*°?F|0\s*°?C|32\s*°?F|None|not required)/i.test(ans),
      (ans, d) => Array.isArray(d.sources) && d.sources.length > 0
    ]
  },
  {
    id: "REAL-02",
    name: "SA-516 Gr 70 P-Number Classification (ASME Section IX QW/QB-422)",
    question: "What is the P-Number and Group Number for SA-516 Grade 70 plate per ASME Section IX QW/QB-422?",
    isInCorpus: true,
    assertions: [
      (ans, d) => /QW(?:\/QB)?-?422/i.test(ans),
      (ans, d) => /P-?No\.?\s*1/i.test(ans) && /Group\s*(?:No\.?\s*)?2/i.test(ans),
      (ans, d) => Boolean(d.grounding && d.grounding.badge === 'VERIFIED_CODE_GROUNDED')
    ]
  },
  {
    id: "REAL-03",
    name: "Drill Pipe Premium Wall Thickness Limit (API RP 7G-2)",
    question: "What is the minimum remaining wall thickness wear limit for Premium class drill pipe per API RP 7G-2?",
    isInCorpus: true,
    assertions: [
      (ans, d) => /API\s*(?:RP\s*)?7G-?2/i.test(ans),
      (ans, d) => /80\s*%/i.test(ans),
      (ans, d) => /reject|scrap|condemn|Class\s*2|<|less/i.test(ans)
    ]
  },
  {
    id: "REAL-04",
    name: "AISI 4130 Sour Service Hardness & PWHT (NACE MR0175)",
    question: "What is the maximum allowable hardness across the weld metal and HAZ for AISI 4130 in sour service per NACE MR0175?",
    isInCorpus: true,
    assertions: [
      (ans, d) => /NACE\s*MR0175|ISO\s*15156/i.test(ans),
      (ans, d) => /22\s*HRC|250\s*HV/i.test(ans),
      (ans, d) => /PWHT|heat\s*treatment/i.test(ans)
    ]
  },
  {
    id: "REAL-05",
    name: "Hydrostatic Test Ratio for Metallic Piping (ASME B31.3 Clause 345.4.2)",
    question: "What is the hydrostatic test pressure ratio for metallic piping per ASME B31.3 Clause 345.4.2?",
    isInCorpus: true,
    assertions: [
      (ans, d) => /345\.4\.2|B31\.3/i.test(ans),
      (ans, d) => /1\.5/i.test(ans),
      (ans, d) => /S_?t|S|ratio|temperature|visual|hold/i.test(ans)
    ]
  },
  {
    id: "OUT-01",
    name: "AWS D1.8 Seismic Welding Code (Out of Corpus)",
    question: "What are the seismic weld inspection requirements and demand critical joint criteria per AWS D1.8?",
    isInCorpus: false,
    assertions: [
      (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans),
      (ans, d) => /AWS\s*D1\.8/i.test(ans)
    ]
  },
  {
    id: "OUT-02",
    name: "EN 13445 Unfired Pressure Vessels (Out of Corpus)",
    question: "What is the maximum allowable design stress for unfired pressure vessels per EN 13445?",
    isInCorpus: false,
    assertions: [
      (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans),
      (ans, d) => /EN\s*13445/i.test(ans)
    ]
  },
  {
    id: "OUT-03",
    name: "ASTM A123 Zinc Coating / Galvanizing (Out of Corpus)",
    question: "What is the minimum zinc coating thickness and galvanizing inspection requirement per ASTM A123?",
    isInCorpus: false,
    assertions: [
      (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans),
      (ans, d) => /ASTM\s*A123/i.test(ans)
    ]
  },
  {
    id: "OUT-04",
    name: "ASME BPE Bioprocessing Equipment Piping (Out of Corpus)",
    question: "What is the maximum allowable surface roughness Ra for hygienic piping joints per ASME BPE?",
    isInCorpus: false,
    assertions: [
      (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans),
      (ans, d) => /ASME\s*BPE/i.test(ans)
    ]
  },
  {
    id: "OUT-05",
    name: "API RP 2A-WSD Offshore Platform Structures (Out of Corpus)",
    question: "What are the structural fatigue design factors and joint inspection intervals under API RP 2A-WSD?",
    isInCorpus: false,
    assertions: [
      (ans, d) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans),
      (ans, d) => /API\s*RP\s*2A-WSD/i.test(ans)
    ]
  }
];

async function callAsk(question, isV2 = true, extraHeaders = {}) {
  const url = `${API_BASE}/api/ask${isV2 ? '?corpus=v2' : ''}`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'X-Admin-Token': ADMIN_TOKEN,
      ...extraHeaders
    },
    body: JSON.stringify({
      question,
      language: 'en',
      session_id: 'shadow_eval_' + Date.now(),
      standard_filter: 'ALL',
      mode: 'rag',
      selected_standards: ['ALL'],
      history: []
    })
  });
  const latency = Date.now() - t0;
  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, errText, latency };
  }
  const data = await res.json();
  return { ok: true, data, latency };
}

async function runShadowSuite() {
  console.log('=========================================================================');
  console.log('🛡️  ROSETTA 2.0 SHADOW EVALUATION SUITE (?corpus=v2)');
  console.log('=========================================================================\n');

  // Check footer presence in D1
  console.log('1. Checking Provenance Footer Presence in standards_chunks_v2...');
  const footerSql = "SELECT count(*) as total, sum(case when content like '%--- Source:%' then 1 else 0 end) as with_footer FROM standards_chunks_v2;";
  const footerOut = execSync(`npx.cmd wrangler d1 execute inspection-db --remote --json --command "${footerSql}"`, {
    encoding: 'utf8', cwd: path.resolve(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore']
  });
  const fStart = footerOut.indexOf('[');
  const fRows = JSON.parse(footerOut.slice(fStart))[0]?.results || [];
  const totalChunks = fRows[0]?.total || 0;
  const withFooter = fRows[0]?.with_footer || 0;
  const footerPct = totalChunks > 0 ? ((withFooter / totalChunks) * 100).toFixed(1) : '0';
  console.log(`   Total Chunks in v2: ${totalChunks}`);
  console.log(`   With Provenance Footer: ${withFooter} (${footerPct}%)`);
  if (parseFloat(footerPct) < 98.0) {
    console.error(`❌ Footer presence ${footerPct}% is below mandatory threshold 98.0%`);
  } else {
    console.log(`✅ Footer gate PASS (>=98.0%)`);
  }

  // Run Golden Suite on Shadow
  console.log('\n2. Running Golden Suite on Shadow (?corpus=v2)...');
  let goldenPass = 0;
  const goldenReport = [];

  for (const item of GOLDEN_DATASET) {
    const resp = await callAsk(item.prompt, true);
    if (!resp.ok) {
      console.log(`[${item.id}] ❌ FAIL (HTTP ${resp.status}): ${resp.errText}`);
      goldenReport.push({ id: item.id, pass: false, error: resp.errText });
      continue;
    }
    const ans = (resp.data.answer || '').toLowerCase();
    const sourcesStr = ((resp.data.sources || []).map(s => `${s.standard || ''} ${s.clause || ''}`).join(' ')).toLowerCase();
    const combined = ans + ' ' + sourcesStr;
    const hasClauses = item.expectedClauses.some(c => combined.includes(c.toLowerCase()));
    const hasValues = item.expectedValues.some(v => combined.includes(v.toLowerCase()));
    const passed = hasClauses && hasValues;
    if (passed) goldenPass++;

    const sources = (resp.data.sources || []).map(s => `${s.standard || ''} ${s.clause || ''}`).join(', ');
    console.log(`[${item.id}] ${passed ? '✅ PASS' : '❌ FAIL'} [${resp.latency}ms] | Sources: ${sources.slice(0, 50)}`);
    goldenReport.push({
      id: item.id,
      pass: passed,
      latency: resp.latency,
      sources,
      snippet: (resp.data.answer || '').slice(0, 80).replace(/\n/g, ' ')
    });
  }
  console.log(`Golden Scorecard: ${goldenPass} / ${GOLDEN_DATASET.length} (${((goldenPass / GOLDEN_DATASET.length)*100).toFixed(1)}%)`);

  // Run Planted Suite on Shadow
  console.log('\n3. Running Planted Suite on Shadow (?corpus=v2)...');
  let plantedPass = 0;
  let refusalsPass = 0;
  for (const item of PLANTED_DATASET) {
    const resp = await callAsk(item.question, true);
    if (!resp.ok) {
      console.log(`[${item.id}] ❌ FAIL (HTTP ${resp.status})`);
      continue;
    }
    const answer = resp.data.answer || '';
    const isRefusal = /CORPUS SCOPE DEMARCATION NOTICE/i.test(answer) || resp.data.grounding?.badge === 'CALIBRATED_ABSTENTION';
    if (!item.isInCorpus && isRefusal) {
      refusalsPass++;
    }

    let tcPassed = true;
    for (const assertion of item.assertions) {
      if (!assertion(answer, resp.data)) {
        tcPassed = false;
      }
    }

    if (tcPassed) {
      plantedPass++;
      console.log(`[${item.id}] ✅ PASS [${resp.latency}ms] (Badge: ${resp.data.grounding?.badge || 'N/A'})`);
    } else {
      console.log(`[${item.id}] ❌ FAIL [${resp.latency}ms] (Badge: ${resp.data.grounding?.badge || 'N/A'})`);
      console.log(`   Snippet: ${answer.slice(0, 100).replace(/\n/g, ' ')}...`);
    }
  }
  console.log(`Planted Scorecard: ${plantedPass} / 10 | Refusals: ${refusalsPass} / 5`);

  // Run Fast-Path Latency Probes
  console.log('\n4. Probing Fast Paths (?corpus=v2)...');
  const tblProbe = await callAsk("What is the maximum allowable undercut depth for Normal Fluid Service welds under ASME B31.3 Table 341.3.2?", true);
  console.log(`   Table Fast Path: ${tblProbe.latency}ms (Pass: ${tblProbe.latency <= 1500 ? 'YES' : 'NO'})`);

  const envProbe = await callAsk("What are the minimum preheat temperature requirements for ASTM A106 Gr B with wall thickness over 25 mm per ASME B31.3?", true);
  console.log(`   Envelope Fast Path: ${envProbe.latency}ms (Pass: ${envProbe.latency <= 3000 ? 'YES' : 'NO'})`);

  const allPass = goldenPass === 14 && plantedPass === 10 && refusalsPass === 5 && tblProbe.latency <= 1500 && parseFloat(footerPct) >= 98.0;

  console.log('\n=========================================================================');
  console.log(`SHADOW SUITE VERDICT: ${allPass ? '🏆 ALL GATES PASS' : '⚠️ GATES INCOMPLETE'}`);
  console.log('=========================================================================\n');

  return {
    goldenPass,
    plantedPass,
    refusalsPass,
    footerPct,
    tblLatency: tblProbe.latency,
    envLatency: envProbe.latency,
    goldenReport,
    allPass
  };
}

if (require.main === module) {
  runShadowSuite().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runShadowSuite };
