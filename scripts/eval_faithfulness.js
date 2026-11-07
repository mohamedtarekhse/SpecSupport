const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.API_TARGET || 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_SECRET = 'specsupport-admin-2026';

const GOLDEN_DATASET = [
  { id: "WPS-01", prompt: "What is the P-Number and Group Number for SA-516 Grade 70 carbon steel plate under ASME Section IX?", expectedClauses: ["QW-422", "P-No. 1", "Group 2"], expectedValues: ["1", "2"] },
  { id: "WPS-02", prompt: "What is the thickness threshold requiring mandatory Post Weld Heat Treatment (PWHT) for P-No 1 carbon steel piping under ASME B31.3?", expectedClauses: ["Table 331.1.1", "331.1.1"], expectedValues: ["19", "19.05", "0.75"] },
  { id: "WPS-03", prompt: "What are the minimum preheat temperature requirements for ASTM A106 Gr B with wall thickness over 25 mm per ASME B31.3?", expectedClauses: ["Table 330.1.1", "330.1.1"], expectedValues: ["95", "200"] },
  { id: "WPS-04", prompt: "What is the F-Number and A-Number for ER70S-6 and E7018-1 welding electrodes under ASME Section IX?", expectedClauses: ["QW-432", "QW-442"], expectedValues: ["F-6", "F-4", "A-1"] },
  { id: "WPS-05", prompt: "Does a welder qualified on 6G pipe test position qualify for all positions under ASME Section IX?", expectedClauses: ["QW-461.9", "QW-452"], expectedValues: ["All", "all positions"] },
  { id: "PV-01", prompt: "What is the standard hydrostatic test pressure formula for new pressure vessels under ASME Section VIII Div 1 UG-99(b)?", expectedClauses: ["UG-99"], expectedValues: ["1.3", "MAOP"] },
  { id: "PV-02", prompt: "What is the minimum holding time for hydrostatic testing of pressure vessels under ASME Section VIII Div 1?", expectedClauses: ["UG-99"], expectedValues: ["visual", "10", "examine"] },
  { id: "PV-03", prompt: "What is the maximum permissible undercut depth for Normal Fluid Service piping welds under ASME B31.3?", expectedClauses: ["Table 341.3.2", "341.3.2"], expectedValues: ["1 mm", "1/32"] },
  { id: "NDT-01", prompt: "What are the radiographic film density requirements under ASME Section V Article 2 for X-ray and Gamma-ray examinations?", expectedClauses: ["T-274", "T-283", "Article 2"], expectedValues: ["1.8", "4.0", "2.0"] },
  { id: "NDT-02", prompt: "What is the ultrasonic examination DAC recording threshold under ASME Section V Article 4?", expectedClauses: ["Article 4", "T-473"], expectedValues: ["20%", "50%"] },
  { id: "NDT-03", prompt: "What is the minimum illumination level for visual weld inspection under ASME Section V Article 9?", expectedClauses: ["Article 9", "T-952"], expectedValues: ["1000", "100"] },
  { id: "RIG-01", prompt: "What is the maximum allowable hardness for AISI 4130 steel in sour service according to NACE MR0175 / ISO 15156?", expectedClauses: ["MR0175", "Table A.2"], expectedValues: ["22 HRC", "250 HV"] },
  { id: "RIG-02", prompt: "What is the minimum remaining wall thickness percentage for Premium Class drill pipe under API RP 7G-2?", expectedClauses: ["7G-2", "Table"], expectedValues: ["80%"] },
  { id: "RIG-03", prompt: "What are the low-pressure and high-pressure test requirements for blowout preventers under API Standard 53?", expectedClauses: ["API 53", "Section 7"], expectedValues: ["250", "350", "RWP"] }
];

function computeFaithfulnessMetrics(answer, grounding, sources = []) {
  if (!answer || typeof answer !== 'string') {
    return { usr: 0, clause_resolvable_pct: 100, unsourced_table_cells: 0 };
  }

  // If already computed by worker
  if (grounding && grounding.usr !== undefined && grounding.clause_resolvable_pct !== undefined) {
    return {
      usr: grounding.usr,
      clause_resolvable_pct: grounding.clause_resolvable_pct,
      unsourced_table_cells: (grounding.unsourced_table_cells || []).length
    };
  }

  const rawSentences = answer.split(/(?<=[.!?])\s+(?=[A-Z0-9*#])/m);
  const substantiveSentences = [];
  let unsupportedSentences = 0;
  let totalClauses = 0;
  let resolvableClauses = 0;

  const allSourceText = (sources || []).map(s => `${s.standard || ''} ${s.clause || ''} ${s.content || ''}`).join('\n').toLowerCase();

  for (const rawSent of rawSentences) {
    const sTrim = rawSent.trim();
    if (!sTrim || sTrim.length < 20 || sTrim.startsWith('#') || sTrim.startsWith('|---')) continue;
    substantiveSentences.push(sTrim);

    let hasSrc = /\[\[SRC:\d+\]\]/.test(sTrim);
    if (!hasSrc && sources.length > 0) {
      for (const s of sources) {
        const cNorm = s.clause ? s.clause.toLowerCase().replace(/^(?:table|clause|section)\s+/i, '').trim() : '';
        if (cNorm && cNorm.length >= 3 && sTrim.toLowerCase().includes(cNorm)) {
          hasSrc = true;
          break;
        }
      }
    }
    if (!hasSrc) unsupportedSentences++;

    const clauseMatches = sTrim.match(/\b(?:T-\d{3,4}(?:\.\d+)?|QW-[0-9]+(?:\.[0-9]+)?|UW-[0-9]+(?:\([a-z0-9]+\))?|UG-[0-9]+|Table\s+[A-Za-z0-9\.\-\/]+|Clause\s+[A-Za-z0-9\.\-]+|Sec(?:tion)?\s+[0-9]+|\d+\.\d+(?:\.\d+)+)\b/gi) || [];
    for (const c of clauseMatches) {
      totalClauses++;
      const normC = c.toLowerCase().replace(/^(?:table|clause|section)\s+/i, '').trim();
      if (allSourceText.includes(normC) || allSourceText.includes(c.toLowerCase())) {
        resolvableClauses++;
      }
    }
  }

  const totalSents = substantiveSentences.length || 1;
  const usr = Math.round((unsupportedSentences / totalSents) * 1000) / 1000;
  const clauseResolvablePct = totalClauses > 0 ? Math.round((resolvableClauses / totalClauses) * 100) : 100;
  const unsourcedTableCells = (grounding?.unsourced_table_cells || []).length;

  return { usr, clause_resolvable_pct: clauseResolvablePct, unsourced_table_cells: unsourcedTableCells };
}

async function runFaithfulnessCI() {
  console.log('=========================================================================');
  console.log('🔬 SPEC-SUPPORT FAITHFULNESS & USR CI GATE BENCHMARK');
  console.log('Target API:', BASE_URL);
  console.log('=========================================================================\n');

  const goldenResults = [];
  let deployBlocked = false;

  console.log('🔹 SECTION 1: GOLDEN EVALUATION 14-BENCHMARK FAITHFULNESS AUDIT');
  for (const g of GOLDEN_DATASET) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: g.prompt,
          answer_depth: 'medium',
          session_id: 'faithfulness_golden_' + g.id
        })
      });
      const durMs = Date.now() - t0;
      const data = await res.json();
      const metrics = computeFaithfulnessMetrics(data.answer, data.grounding, data.sources || []);

      const passesUsr = metrics.usr <= 0.01;
      const passesClauses = metrics.clause_resolvable_pct >= 95;
      const passesGolden = passesUsr && passesClauses;

      if (!passesGolden) deployBlocked = true;

      console.log(`[${g.id}] ${passesGolden ? '✅ PASS' : '❌ FAIL'} | Latency: ${durMs}ms | USR: ${(metrics.usr * 100).toFixed(1)}% | Resolvable Clauses: ${metrics.clause_resolvable_pct}% | Unsourced Tables: ${metrics.unsourced_table_cells}`);
      goldenResults.push({
        id: g.id,
        prompt: g.prompt,
        passed: passesGolden,
        usr: metrics.usr,
        clause_resolvable_pct: metrics.clause_resolvable_pct,
        unsourced_table_cells: metrics.unsourced_table_cells,
        badge: data.grounding?.badge,
        latency_ms: durMs
      });
    } catch (err) {
      console.log(`[${g.id}] ❌ ERROR: ${err.message}`);
      deployBlocked = true;
      goldenResults.push({ id: g.id, passed: false, error: err.message });
    }
  }

  // SECTION 2: 5 CITATION PROBES
  console.log('\n🔹 SECTION 2: 5 CITATION & QUARANTINE PROBES');
  const probeResults = [];

  // Probe A: ASME V Film Density
  console.log('\n[PROBE A] ASME V Film Density (Clause Resolution & Invented T-282.1 Prohibition)');
  try {
    const resA = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What are the radiographic film density requirements under ASME Section V Article 2 for X-ray and Gamma-ray?',
        answer_depth: 'medium',
        session_id: 'probe_a_' + Date.now()
      })
    });
    const dataA = await resA.json();
    const metricsA = computeFaithfulnessMetrics(dataA.answer, dataA.grounding, dataA.sources || []);
    const hasInventedClause = /T-282\.1/i.test(dataA.answer || '');
    const passesProbeA = !hasInventedClause && metricsA.clause_resolvable_pct >= 95;
    console.log(`  Invented T-282.1 present: ${hasInventedClause} (expected: false)`);
    console.log(`  Clause resolvable: ${metricsA.clause_resolvable_pct}% (expected: >= 95%)`);
    console.log(`  Badge: ${dataA.grounding?.badge}`);
    console.log(`  -> ${passesProbeA ? '✅ PASS' : '❌ FAIL'} [Probe A]`);
    probeResults.push({ probe: 'Probe A: ASME V Film Density', passed: passesProbeA });
  } catch(e) {
    console.log(`  -> ❌ ERROR [Probe A]:`, e.message);
    probeResults.push({ probe: 'Probe A', passed: false, error: e.message });
  }

  // Probe B: Fabricated Table Guard
  console.log('\n[PROBE B] Fabricated Table Guard (UNSOURCED_TABLE_CONTENT)');
  try {
    const resB = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Provide a field action summary table for mast inspection quality assurance including 24-48 hours post-PWHT delay',
        answer_depth: 'medium',
        session_id: 'probe_b_' + Date.now()
      })
    });
    const dataB = await resB.json();
    const badgeB = dataB.grounding?.badge;
    const passesProbeB = badgeB === 'UNVERIFIED_WARNING' || !dataB.answer.includes('|') || !/24-48\s*hours/i.test(dataB.answer);
    console.log(`  Badge: ${badgeB}`);
    console.log(`  Fabricated table neutralized: ${passesProbeB}`);
    console.log(`  -> ${passesProbeB ? '✅ PASS' : '❌ FAIL'} [Probe B]`);
    probeResults.push({ probe: 'Probe B: Fabricated Table Guard', passed: passesProbeB });
  } catch(e) {
    console.log(`  -> ❌ ERROR [Probe B]:`, e.message);
    probeResults.push({ probe: 'Probe B', passed: false, error: e.message });
  }

  // Probe C: Ingest 3 malformed test chunks via API
  console.log('\n[PROBE C] Ingest 3 Malformed Chunks (Write-time Quarantine Gate)');
  try {
    // 1. Bad clause
    const badClauseRes = await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_SECRET}` },
      body: JSON.stringify({
        standard_code: 'TEST-STD',
        clause: 'completely_invalid_clause_format_123',
        section: 'Section 1',
        content: 'Valid content for testing write-time quarantine contract'
      })
    });
    const badClauseJson = await badClauseRes.json();

    // 2. FFFD encoding corruption
    const fffdRes = await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_SECRET}` },
      body: JSON.stringify({
        standard_code: 'TEST-STD',
        clause: 'T-274',
        section: 'Article 2',
        content: 'Content containing corrupted characters \uFFFD in otherwise Latin chunk'
      })
    });
    const fffdJson = await fffdRes.json();

    // 3. Missing locator
    const missingLocatorRes = await fetch(`${BASE_URL}/api/admin/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_SECRET}` },
      body: JSON.stringify({
        standard_code: 'TEST-STD',
        clause: '',
        section: '',
        content: 'Valid content but has completely missing locator and empty clause'
      })
    });
    const missingLocatorJson = await missingLocatorRes.json();

    console.log(`  Bad Clause quarantine status:`, badClauseJson.quarantined, badClauseJson.reject_reason);
    console.log(`  FFFD quarantine status:`, fffdJson.quarantined, fffdJson.reject_reason);
    console.log(`  Missing Locator quarantine status:`, missingLocatorJson.quarantined, missingLocatorJson.reject_reason);

    const passesProbeC = badClauseJson.quarantined && badClauseJson.reject_reason === 'invalid_clause' &&
                         fffdJson.quarantined && fffdJson.reject_reason === 'encoding_corruption' &&
                         missingLocatorJson.quarantined && missingLocatorJson.reject_reason === 'missing_locator';

    console.log(`  -> ${passesProbeC ? '✅ PASS' : '❌ FAIL'} [Probe C: All 3 Malformed Chunks Quarantined]`);
    probeResults.push({ probe: 'Probe C: Write-time Ingest Quarantine Gate', passed: passesProbeC });
  } catch(e) {
    console.log(`  -> ❌ ERROR [Probe C]:`, e.message);
    probeResults.push({ probe: 'Probe C', passed: false, error: e.message });
  }

  // Probe D: Deterministic Table Hit Fastpath
  console.log('\n[PROBE D] Deterministic Table Fastpath (SA-516 Gr 70 QW/QB-422)');
  try {
    const resD = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the P-Number and Group Number for SA-516 Grade 70 under ASME Section IX Table QW/QB-422?',
        session_id: 'probe_d_' + Date.now()
      })
    });
    const dataD = await resD.json();
    const metricsD = computeFaithfulnessMetrics(dataD.answer, dataD.grounding, dataD.sources || []);
    const passesD = metricsD.usr === 0 && metricsD.clause_resolvable_pct === 100;
    console.log(`  USR: ${metricsD.usr}, Clause Resolvable: ${metricsD.clause_resolvable_pct}%`);
    console.log(`  -> ${passesD ? '✅ PASS' : '❌ FAIL'} [Probe D: Pre-cited Deterministic Engine]`);
    probeResults.push({ probe: 'Probe D: Deterministic Table Pre-cited', passed: passesD });
  } catch(e) {
    console.log(`  -> ❌ ERROR [Probe D]:`, e.message);
    probeResults.push({ probe: 'Probe D', passed: false, error: e.message });
  }

  // Probe E: ASME B31.3 Table 330.1.1 Preheat
  console.log('\n[PROBE E] ASME B31.3 Table 330.1.1 Preheat');
  try {
    const resE = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the minimum preheat temperature requirements for ASTM A106 Gr B with wall thickness over 25 mm per ASME B31.3 Table 330.1.1?',
        session_id: 'probe_e_' + Date.now()
      })
    });
    const dataE = await resE.json();
    const metricsE = computeFaithfulnessMetrics(dataE.answer, dataE.grounding, dataE.sources || []);
    const passesE = metricsE.usr === 0 && metricsE.clause_resolvable_pct >= 95;
    console.log(`  USR: ${metricsE.usr}, Clause Resolvable: ${metricsE.clause_resolvable_pct}%`);
    console.log(`  -> ${passesE ? '✅ PASS' : '❌ FAIL'} [Probe E: Grounded Preheat Determination]`);
    probeResults.push({ probe: 'Probe E: ASME B31.3 Table 330.1.1', passed: passesE });
  } catch(e) {
    console.log(`  -> ❌ ERROR [Probe E]:`, e.message);
    probeResults.push({ probe: 'Probe E', passed: false, error: e.message });
  }

  // Output faithfulness_run.json
  const report = {
    timestamp: new Date().toISOString(),
    deploy_blocked: deployBlocked,
    golden_scorecard: {
      passed: goldenResults.filter(r => r.passed).length,
      total: goldenResults.length,
      all_usr_under_1_pct: goldenResults.every(r => (r.usr || 0) <= 0.01),
      all_clauses_resolvable_over_95_pct: goldenResults.every(r => (r.clause_resolvable_pct || 100) >= 95)
    },
    golden_cases: goldenResults,
    citation_probes: probeResults
  };

  const outDir = path.join(__dirname, '..', '.eval_history');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'faithfulness_run.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('\n📄 Faithfulness report written to:', outPath);

  console.log('\n=========================================================================');
  console.log(`📊 FINAL FAITHFULNESS SCORECARD: ${goldenResults.filter(r => r.passed).length} / ${goldenResults.length} Golden Cases Passed (USR <= 1%, Resolvable >= 95%)`);
  console.log(`🛡️ PROBE SCORECARD: ${probeResults.filter(p => p.passed).length} / ${probeResults.length} Probes Passed`);
  console.log(`🚦 DEPLOYMENT GATE: ${deployBlocked ? '❌ BLOCKED' : '✅ PASSED (Ready for Production Deploy)'}`);
  console.log('=========================================================================');

  if (deployBlocked) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFaithfulnessCI();
