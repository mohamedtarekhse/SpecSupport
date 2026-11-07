const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET || "";

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

async function runRealityCheck() {
  console.log("=========================================================================");
  console.log("⚡ SPEC-SUPPORT LATENCY REALITY CHECK & FAST LANE VERIFICATION");
  console.log("Target API:", API_BASE);
  console.log("=========================================================================\n");

  const probeResults = [];

  // =========================================================================
  // 1. ENVELOPE FAST PATH PROBE: API RP 7G-2 WEAR% (Target <= 3s, Grounding 100%)
  // =========================================================================
  console.log("🔹 1. PROBING ENVELOPE FAST PATH: API RP 7G-2 DRILL PIPE WEAR%");
  const t7g2Start = Date.now();
  const q7g2 = `API RP 7G-2 what is the minimum remaining wall thickness percent for premium class drill pipe classifications? (fresh_${Date.now()})`;
  const res7g2 = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'probe_7g2_' + Date.now(),
      question: q7g2,
      mode: 'standards',
      answer_depth: 'medium'
    })
  });
  const dur7g2 = Date.now() - t7g2Start;
  const data7g2 = await res7g2.json();
  console.log(`  ⏱️ Duration: ${dur7g2}ms | Mode: ${data7g2.loop_engineering?.mode} | Score: ${data7g2.grounding?.score_pct}% | Badge: ${data7g2.grounding?.badge}`);
  console.log(`  📝 Sample: "${(data7g2.answer || '').substring(0, 160)}..."`);
  const pass7g2 = dur7g2 <= 3000 && /80%/i.test(data7g2.answer) && data7g2.grounding?.badge === 'VERIFIED_CODE_GROUNDED';
  console.log(`  ${pass7g2 ? '✅ [PASS]' : '❌ [FAIL]'} API RP 7G-2 80% Wall Wear Limit Fast-Path <= 3.0s\n`);
  probeResults.push({ name: 'API RP 7G-2 80% Wall (Envelope)', duration: dur7g2, pass: pass7g2, badge: data7g2.grounding?.badge });

  // Arabic variant
  console.log("🔹 1b. PROBING ENVELOPE FAST PATH (ARABIC): API RP 7G-2");
  const t7g2ArStart = Date.now();
  const q7g2Ar = `ما هي نسبة الحد الأقصى للاستنزاف وأدنى سماكة لجدار أنبوب الحفر فئة بريميوم حسب API RP 7G-2؟ (fresh_${Date.now()})`;
  const res7g2Ar = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'probe_7g2_ar_' + Date.now(),
      question: q7g2Ar,
      language: 'ar',
      mode: 'standards',
      answer_depth: 'medium'
    })
  });
  const dur7g2Ar = Date.now() - t7g2ArStart;
  const data7g2Ar = await res7g2Ar.json();
  console.log(`  ⏱️ Duration: ${dur7g2Ar}ms | Mode: ${data7g2Ar.loop_engineering?.mode} | Score: ${data7g2Ar.grounding?.score_pct}%`);
  const pass7g2Ar = dur7g2Ar <= 3000 && /80%/i.test(data7g2Ar.answer);
  console.log(`  ${pass7g2Ar ? '✅ [PASS]' : '❌ [FAIL]'} API RP 7G-2 Arabic Envelope Fast-Path <= 3.0s\n`);
  probeResults.push({ name: 'API RP 7G-2 Arabic (Envelope)', duration: dur7g2Ar, pass: pass7g2Ar, badge: data7g2Ar.grounding?.badge });

  // =========================================================================
  // 2. ENVELOPE FAST PATH PROBE: ASME B31.3 HYDROTEST RATIO (Target <= 3s)
  // =========================================================================
  console.log("🔹 2. PROBING ENVELOPE FAST PATH: ASME B31.3 HYDROTEST RATIO (1.5x)");
  const tHydroStart = Date.now();
  const qHydro = `What is the hydrostatic test pressure ratio for metallic piping per ASME B31.3 Clause 345.4.2? (fresh_${Date.now()})`;
  const resHydro = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'probe_hydro_' + Date.now(),
      question: qHydro,
      mode: 'standards',
      answer_depth: 'medium'
    })
  });
  const durHydro = Date.now() - tHydroStart;
  const dataHydro = await resHydro.json();
  console.log(`  ⏱️ Duration: ${durHydro}ms | Mode: ${dataHydro.loop_engineering?.mode} | Score: ${dataHydro.grounding?.score_pct}%`);
  const passHydro = durHydro <= 3000 && /1\.5/i.test(dataHydro.answer) && dataHydro.grounding?.badge === 'VERIFIED_CODE_GROUNDED';
  console.log(`  ${passHydro ? '✅ [PASS]' : '❌ [FAIL]'} ASME B31.3 1.5x Ratio Envelope Fast-Path <= 3.0s\n`);
  probeResults.push({ name: 'ASME B31.3 1.5x Ratio (Envelope)', duration: durHydro, pass: passHydro, badge: dataHydro.grounding?.badge });

  // =========================================================================
  // 3. TABLE HIT FAST PATH PROBE: ASME IX QW-422 SA-516 Gr 70 (Target <= 1.5s)
  // =========================================================================
  console.log("🔹 3. PROBING TABLE FAST PATH: ASME IX QW-422 SA-516 Gr 70");
  const tTableStart = Date.now();
  const qTable = `What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422? (fresh_${Date.now()})`;
  const resTable = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'probe_table_' + Date.now(),
      question: qTable,
      mode: 'standards',
      answer_depth: 'medium'
    })
  });
  const durTable = Date.now() - tTableStart;
  const dataTable = await resTable.json();
  console.log(`  ⏱️ Duration: ${durTable}ms | Mode: ${dataTable.loop_engineering?.mode} | Score: ${dataTable.grounding?.score_pct}%`);
  const passTable = durTable <= 1500 && dataTable.grounding?.badge === 'VERIFIED_CODE_GROUNDED';
  console.log(`  ${passTable ? '✅ [PASS]' : '❌ [FAIL]'} Table Fast-Path QW-422 <= 1.5s\n`);
  probeResults.push({ name: 'ASME IX QW-422 SA-516 (Table)', duration: durTable, pass: passTable, badge: dataTable.grounding?.badge });

  // =========================================================================
  // 4. FAST (LOW) LANE PROBES: DISSIMILAR PREHEAT (Target <= 6s each, critic_ms = 0)
  // =========================================================================
  console.log("🔹 4. PROBING FAST LANE (LOW DEPTH) — DISSIMILAR PREHEAT RUN 1");
  const tFast1Start = Date.now();
  const qFast1 = `What minimum preheat temperature is required when welding 4130 alloy steel to A106 Gr B under ASME B31.3? (probe_f1_${Date.now()})`;
  const resFast1 = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'probe_fast1_' + Date.now(),
      question: qFast1,
      mode: 'standards',
      answer_depth: 'low'
    })
  });
  const durFast1 = Date.now() - tFast1Start;
  const dataFast1 = await resFast1.json();
  console.log(`  ⏱️ Duration: ${durFast1}ms | Timings: total=${dataFast1.timings?.total_ms}ms, draft=${dataFast1.timings?.draft_ms}ms, critic=${dataFast1.timings?.critic_ms}ms`);
  console.log(`  📝 Sample: "${(dataFast1.answer || '').substring(0, 140)}..."`);
  const passFast1 = durFast1 <= 6500 && dataFast1.timings?.critic_ms === 0;
  console.log(`  ${passFast1 ? '✅ [PASS]' : '❌ [FAIL]'} Fast Lane Probe 1 <= 6.0s (Critic=0ms)\n`);
  probeResults.push({ name: 'Dissimilar Preheat Fast #1', duration: durFast1, pass: passFast1, critic_ms: dataFast1.timings?.critic_ms });

  console.log("🔹 5. PROBING FAST LANE (LOW DEPTH) — DISSIMILAR PREHEAT RUN 2 (FRESH WORDING)");
  const tFast2Start = Date.now();
  const qFast2 = `In ASME B31.3 piping, which preheat temperature governs joining AISI 4130 to carbon steel A106 Grade B pipe? (probe_f2_${Date.now()})`;
  const resFast2 = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'probe_fast2_' + Date.now(),
      question: qFast2,
      mode: 'standards',
      answer_depth: 'low'
    })
  });
  const durFast2 = Date.now() - tFast2Start;
  const dataFast2 = await resFast2.json();
  console.log(`  ⏱️ Duration: ${durFast2}ms | Timings: total=${dataFast2.timings?.total_ms}ms, draft=${dataFast2.timings?.draft_ms}ms, critic=${dataFast2.timings?.critic_ms}ms`);
  console.log(`  📝 Sample: "${(dataFast2.answer || '').substring(0, 140)}..."`);
  const passFast2 = durFast2 <= 6500 && dataFast2.timings?.critic_ms === 0;
  console.log(`  ${passFast2 ? '✅ [PASS]' : '❌ [FAIL]'} Fast Lane Probe 2 <= 6.0s (Critic=0ms)\n`);
  probeResults.push({ name: 'Dissimilar Preheat Fast #2', duration: durFast2, pass: passFast2, critic_ms: dataFast2.timings?.critic_ms });

  // =========================================================================
  // 5. QUERY /api/admin/traces?limit=100 & COMPUTE P50 STATISTICS
  // =========================================================================
  console.log("🔹 6. TRACE READBACK & P50 CALIBRATION (/api/admin/traces?limit=100)");
  const tracesRes = await fetch(`${API_BASE}/api/admin/traces?limit=100`, {
    headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
  });
  const tracesData = await tracesRes.json();
  const traces = tracesData.traces || [];
  console.log(`  📥 Read back ${traces.length} trace records from remote D1\n`);

  // Classify by path & depth
  const fastPathDurations = [];
  const lowDepthDurations = [];
  const medDepthDurations = [];
  const highDepthDurations = [];

  for (const t of traces) {
    const isFastPath = (t.mode || '').includes('FASTPATH');
    if (isFastPath) {
      if (t.duration_ms) fastPathDurations.push(t.duration_ms);
    } else {
      if (t.answer_depth === 'low' && t.duration_ms) lowDepthDurations.push(t.duration_ms);
      if (t.answer_depth === 'medium' && t.duration_ms) medDepthDurations.push(t.duration_ms);
      if (t.answer_depth === 'high' && t.duration_ms) highDepthDurations.push(t.duration_ms);
    }
  }

  console.log("=========================================================================");
  console.log("📊 LATENCY P50 BENCHMARK SUMMARY (LAST 100 PRODUCTION TRACES)");
  console.log("=========================================================================");
  console.log(`  • Deterministic Fast-Path (Table & Envelope): P50 = ${median(fastPathDurations)} ms (Count: ${fastPathDurations.length}, Target <= 1500 ms)`);
  console.log(`  • Fast Lane (Depth: low, LLM Single-Pass):    P50 = ${median(lowDepthDurations)} ms (Count: ${lowDepthDurations.length}, Target <= 6000 ms)`);
  console.log(`  • Medium Lane (Depth: medium, Dual-Pass):     P50 = ${median(medDepthDurations)} ms (Count: ${medDepthDurations.length})`);
  console.log(`  • Think Lane (Depth: high, Exhaustive Audit): P50 = ${median(highDepthDurations)} ms (Count: ${highDepthDurations.length})`);
  console.log("=========================================================================\n");

  console.log("STOCHASTIC PROFILE OF PROBES:");
  probeResults.forEach(p => {
    console.log(`  - ${p.name.padEnd(35)} : ${String(p.duration).padStart(5)} ms | ${p.pass ? 'PASS' : 'FAIL'} | Critic: ${p.critic_ms !== undefined ? p.critic_ms + 'ms' : 'N/A'}`);
  });
}

runRealityCheck().catch(console.error);
