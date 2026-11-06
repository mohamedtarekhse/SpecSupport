const fs = require('fs');

async function testFastPathAndEnvelopes() {
  console.log("=========================================================================");
  console.log("⚡ TESTING PHASE P2 BATCH B: FAST-PATH LATENCY & ENVELOPE CENSUS LIFTS");
  console.log("=========================================================================\n");

  const fastPathProbes = [
    {
      name: "Probe A: ASME IX QW-422 SA-516 Gr 70",
      question: "What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?",
      expectedClause: "Table QW/QB-422"
    },
    {
      name: "Probe B: API 1104 Table 1 Foot-run Acceptance",
      question: "What are the foot-run acceptance limits in API 1104 Table 1 for weld discontinuities?",
      expectedClause: "Table 1"
    },
    {
      name: "Probe C: ASME B31.3 Table 341.3.2 Acceptance Criteria",
      question: "What are the wall-thickness and undercut acceptance limits in ASME B31.3 Table 341.3.2?",
      expectedClause: "Table 341.3.2"
    }
  ];

  const latencies = {
    fastpath: [],
    rag: [],
    web: []
  };

  console.log("--- 1. DETERMINISTIC TABLE FAST-PATH PROBES (Target: <= 2.5s, 100% Grounded, 0 MCQs) ---");
  for (const p of fastPathProbes) {
    const t0 = Date.now();
    const res = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: p.question,
        language: 'en',
        session_id: `test_fastpath_${Date.now()}`,
        standard_filter: 'ALL',
        mode: 'standards',
        selected_standards: ['ALL'],
        history: []
      })
    });
    const d = await res.json();
    const duration = Date.now() - t0;
    latencies.fastpath.push(duration);

    const isFastPath = d.loop_engineering?.mode === 'DETERMINISTIC_TABLE_FASTPATH' || d.loop_engineering?.mode === 'SEMANTIC_CACHE_FASTPATH' || d.timings?.fast_path === true;
    const isGrounding100 = d.grounding?.score_pct === 100 && d.grounding?.badge === 'VERIFIED_CODE_GROUNDED';
    const zeroMcqs = !d.mcq_questions || d.mcq_questions.length === 0;
    const hasEvidence = Boolean(d.grounding?.evidence?.quote || d.verbatim_evidence_quote);
    const pass = isFastPath && isGrounding100 && zeroMcqs && duration <= 2500;

    console.log(`\n▶ ${p.name}:`);
    console.log(`  └─ Status: ${pass ? '✅ PASS' : '❌ FAIL'} | End-to-End Latency: ${duration}ms (target <= 2500ms)`);
    console.log(`  └─ Mode: ${d.loop_engineering?.mode} | FastPath Flag: ${d.timings?.fast_path}`);
    console.log(`  └─ Grounding: ${d.grounding?.score_pct}% | Badge: ${d.grounding?.badge} | MCQs: ${d.mcq_questions?.length || 0}`);
    console.log(`  └─ Evidence Quote: "${(d.verbatim_evidence_quote || d.grounding?.evidence?.quote || '').substring(0, 80)}..."`);
    console.log(`  └─ Stage Timings:`, d.timings);
  }

  // Also test streaming SSE fast-path
  console.log("\n--- 2. STREAMING FAST-PATH SSE CHECK ---");
  const sseStart = Date.now();
  const sseRes = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask?stream=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify({
      question: "What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?",
      language: 'en',
      session_id: `test_sse_fast_${Date.now()}`,
      standard_filter: 'ALL',
      mode: 'standards',
      selected_standards: ['ALL'],
      history: []
    })
  });
  const sseText = await sseRes.text();
  const sseDuration = Date.now() - sseStart;
  const isSseFast = (sseText.includes('DETERMINISTIC_TABLE_FASTPATH') || sseText.includes('SEMANTIC_CACHE_FASTPATH')) && sseDuration <= 2500;
  console.log(`▶ SSE Streaming Fast Path: ${isSseFast ? '✅ PASS' : '❌ FAIL'} [${sseDuration}ms]`);

  console.log("\n--- 3. VERIFYING REAL-03 AND REAL-05 ENVELOPE CENSUS LIFTS ---");
  const envelopeTests = [
    {
      id: "REAL-03",
      question: "What is the minimum remaining wall thickness wear limit for Premium class drill pipe per API RP 7G-2?"
    },
    {
      id: "REAL-05",
      question: "What is the hydrostatic test pressure ratio for metallic piping per ASME B31.3 Clause 345.4.2?"
    }
  ];

  for (const et of envelopeTests) {
    const t0 = Date.now();
    const res = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: et.question,
        language: 'en',
        session_id: `test_census_${et.id}_${Date.now()}`,
        standard_filter: 'ALL',
        mode: 'rag',
        selected_standards: ['ALL'],
        history: []
      })
    });
    const d = await res.json();
    const duration = Date.now() - t0;
    latencies.rag.push(duration);

    console.log(`\n▶ [${et.id}] ${et.question}`);
    console.log(`  └─ Latency: ${duration}ms | Grounding: ${d.grounding?.score_pct}% | Badge: ${d.grounding?.badge}`);
    console.log(`  └─ Verified Claims: ${d.grounding?.verified_claims} / ${d.grounding?.total_claims} | Unverified: ${d.grounding?.unverified_claims}`);
    if (d.grounding?.flags && d.grounding.flags.length > 0) {
      console.log(`  └─ Remaining Flags:`, d.grounding.flags);
    }
  }

  // Measure Web Mode latency
  console.log("\n--- 4. MEASURING WEB MODE LATENCY ---");
  const webQ = "Explain the basic differences between ASME Section VIII Division 1 and Division 2.";
  const tWeb0 = Date.now();
  const webRes = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: webQ,
      language: 'en',
      session_id: `test_web_${Date.now()}`,
      standard_filter: 'ALL',
      mode: 'web',
      selected_standards: [],
      history: []
    })
  });
  const webData = await webRes.json();
  const webDuration = Date.now() - tWeb0;
  latencies.web.push(webDuration);
  console.log(`▶ Web Mode Query: Duration ${webDuration}ms | Model: ${webData.model_used}`);

  console.log("\n=========================================================================");
  console.log("📊 LATENCY P50 BENCHMARK SUMMARY TABLE:");
  console.log("=========================================================================");
  console.log(`| Execution Mode                  | Sample Count | P50 Latency (ms) | Target        |`);
  console.log(`|---------------------------------|--------------|------------------|---------------|`);
  console.log(`| Fast-Path Table Hit             | ${latencies.fastpath.length}            | ${median(latencies.fastpath)} ms           | <= 2500 ms    |`);
  console.log(`| RAG In-Corpus Standard Draft    | ${latencies.rag.length}            | ${median(latencies.rag)} ms         | ~8000-15000 ms|`);
  console.log(`| Web Mode Literature Synthesis   | ${latencies.web.length}            | ${median(latencies.web)} ms         | ~10000 ms     |`);
  console.log("=========================================================================\n");
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

testFastPathAndEnvelopes();
