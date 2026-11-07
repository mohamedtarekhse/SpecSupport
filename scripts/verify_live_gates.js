// scripts/verify_live_gates.js
// Runs live evaluation benchmarks against the default production endpoint (no query params)

const { execSync } = require('child_process');
const path = require('path');

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
    question: "What is the minimum preheat temperature for ASTM A106 Grade B piping per ASME B31.3?",
    isInCorpus: true,
    assertions: [
      (ans) => /330\.1(?:\.1)?|B31\.3/i.test(ans),
      (ans) => /(?:10\s*°?C|50\s*°?F|79\s*°?C|175\s*°?F|0\s*°?C|32\s*°?F|None|not required)/i.test(ans)
    ]
  },
  {
    id: "REAL-02",
    question: "What is the P-Number and Group Number for SA-516 Grade 70 plate per ASME Section IX QW/QB-422?",
    isInCorpus: true,
    assertions: [
      (ans) => /QW(?:\/QB)?-?422/i.test(ans),
      (ans) => /P-?No\.?\s*1/i.test(ans) && /Group\s*(?:No\.?\s*)?2/i.test(ans)
    ]
  },
  {
    id: "REAL-03",
    question: "What is the minimum remaining wall thickness wear limit for Premium class drill pipe per API RP 7G-2?",
    isInCorpus: true,
    assertions: [
      (ans) => /API\s*(?:RP\s*)?7G-?2/i.test(ans),
      (ans) => /80\s*%/i.test(ans)
    ]
  },
  {
    id: "REAL-04",
    question: "What is the maximum allowable hardness across the weld metal and HAZ for AISI 4130 in sour service per NACE MR0175?",
    isInCorpus: true,
    assertions: [
      (ans) => /NACE\s*MR0175|ISO\s*15156/i.test(ans),
      (ans) => /22\s*HRC|250\s*HV/i.test(ans)
    ]
  },
  {
    id: "REAL-05",
    question: "What is the hydrostatic test pressure ratio for metallic piping per ASME B31.3 Clause 345.4.2?",
    isInCorpus: true,
    assertions: [
      (ans) => /345\.4\.2|B31\.3/i.test(ans),
      (ans) => /1\.5/i.test(ans)
    ]
  },
  {
    id: "OUT-01",
    question: "What are the seismic weld inspection requirements and demand critical joint criteria per AWS D1.8?",
    isInCorpus: false,
    assertions: [(ans) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans)]
  },
  {
    id: "OUT-02",
    question: "What is the maximum allowable design stress for unfired pressure vessels per EN 13445?",
    isInCorpus: false,
    assertions: [(ans) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans)]
  },
  {
    id: "OUT-03",
    question: "What is the minimum zinc coating thickness and galvanizing inspection requirement per ASTM A123?",
    isInCorpus: false,
    assertions: [(ans) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans)]
  },
  {
    id: "OUT-04",
    question: "What is the maximum allowable surface roughness Ra for hygienic piping joints per ASME BPE?",
    isInCorpus: false,
    assertions: [(ans) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans)]
  },
  {
    id: "OUT-05",
    question: "What are the structural fatigue design factors and joint inspection intervals under API RP 2A-WSD?",
    isInCorpus: false,
    assertions: [(ans) => /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans)]
  }
];

async function callAskLive(question) {
  const url = `${API_BASE}/api/ask`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'X-Admin-Token': ADMIN_TOKEN
    },
    body: JSON.stringify({
      question,
      language: 'en',
      session_id: 'live_eval_' + Date.now(),
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

async function runLiveGateSuite() {
  console.log('=========================================================================');
  console.log('🌐 PRODUCTION LIVE GATE VERIFICATION (Rosetta 2.0 Live Cutover)');
  console.log('=========================================================================\n');

  // 1. Provenance footer check
  console.log('1. Checking Live Provenance Footer Presence in standards_chunks...');
  const footerSql = "SELECT count(*) as total, sum(case when content like '%--- Source:%' then 1 else 0 end) as with_footer FROM standards_chunks;";
  const footerOut = execSync(`npx.cmd wrangler d1 execute inspection-db --remote --json --command "${footerSql}"`, {
    encoding: 'utf8', cwd: path.resolve(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore']
  });
  const fRows = JSON.parse(footerOut.slice(footerOut.indexOf('[')))[0]?.results || [];
  const totalChunks = fRows[0]?.total || 0;
  const withFooter = fRows[0]?.with_footer || 0;
  const footerPct = totalChunks > 0 ? ((withFooter / totalChunks) * 100).toFixed(1) : '0';
  console.log(`   Live Chunks: ${totalChunks} | With Provenance Footer: ${withFooter} (${footerPct}%)`);

  // 2. Golden Suite
  console.log('\n2. Running Golden Suite on Live...');
  let goldenPass = 0;
  for (const item of GOLDEN_DATASET) {
    const resp = await callAskLive(item.prompt);
    if (!resp.ok) {
      console.log(`[${item.id}] ❌ FAIL: ${resp.errText}`);
      continue;
    }
    const ans = (resp.data.answer || '').toLowerCase();
    const sourcesStr = ((resp.data.sources || []).map(s => `${s.standard || ''} ${s.clause || ''}`).join(' ')).toLowerCase();
    const combined = ans + ' ' + sourcesStr;
    const hasClauses = item.expectedClauses.some(c => combined.includes(c.toLowerCase()));
    const hasValues = item.expectedValues.some(v => combined.includes(v.toLowerCase()));
    const passed = hasClauses && hasValues;
    if (passed) goldenPass++;
    console.log(`[${item.id}] ${passed ? '✅ PASS' : '❌ FAIL'} [${resp.latency}ms]`);
  }
  console.log(`Golden Scorecard: ${goldenPass} / 14`);

  // 3. Planted Suite
  console.log('\n3. Running Planted Suite on Live...');
  let plantedPass = 0;
  let refusalsPass = 0;
  for (const item of PLANTED_DATASET) {
    const resp = await callAskLive(item.question);
    if (!resp.ok) {
      console.log(`[${item.id}] ❌ FAIL`);
      continue;
    }
    const ans = resp.data.answer || '';
    const isRefusal = /CORPUS SCOPE DEMARCATION NOTICE/i.test(ans) || resp.data.grounding?.badge === 'CALIBRATED_ABSTENTION';
    if (!item.isInCorpus && isRefusal) refusalsPass++;

    let tcPassed = true;
    for (const a of item.assertions) {
      if (!a(ans, resp.data)) tcPassed = false;
    }
    if (tcPassed) plantedPass++;
    console.log(`[${item.id}] ${tcPassed ? '✅ PASS' : '❌ FAIL'} [${resp.latency}ms] (Badge: ${resp.data.grounding?.badge || 'N/A'})`);
  }
  console.log(`Planted Scorecard: ${plantedPass} / 10 | Refusals: ${refusalsPass} / 5`);

  // 4. Fast-path latency probes
  console.log('\n4. Probing Fast Paths...');
  const tblProbe = await callAskLive("What is the maximum allowable undercut depth for Normal Fluid Service welds under ASME B31.3 Table 341.3.2?");
  console.log(`   Table Fast Path: ${tblProbe.latency}ms (Pass: ${tblProbe.latency <= 1500 ? 'YES' : 'NO'})`);

  const envProbe = await callAskLive("What are the minimum preheat temperature requirements for ASTM A106 Gr B with wall thickness over 25 mm per ASME B31.3?");
  console.log(`   Envelope Fast Path: ${envProbe.latency}ms (Pass: ${envProbe.latency <= 3000 ? 'YES' : 'NO'})`);

  const allPass = goldenPass === 14 && plantedPass === 10 && refusalsPass === 5 && tblProbe.latency <= 1500 && parseFloat(footerPct) >= 98.0;

  console.log('\n=========================================================================');
  console.log(`FINAL LIVE VERDICT: ${allPass ? '🏆 PRODUCTION 100% GREEN' : '⚠️ LIVE REGRESSION'}`);
  console.log('=========================================================================\n');

  if (!allPass) process.exit(1);
}

runLiveGateSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
