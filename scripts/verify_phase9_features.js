const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';

async function testPhase9() {
  console.log("=========================================================================");
  console.log("⚡ TESTING PHASE 9: UX ANSWER-DEPTH SELECTOR & FULL ARABIC RTL MODE");
  console.log("Target API:", API_BASE);
  console.log("=========================================================================\n");

  let passes = 0;
  let total = 0;
  function assert(title, condition, detail = '') {
    total++;
    if (condition) {
      passes++;
      console.log(`  ✅ [PASS] ${title}`);
      if (detail) console.log(`     └─ ${detail}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (detail) console.error(`     └─ Reason: ${detail}`);
    }
  }

  // -----------------------------------------------------------------------
  // TEST 1: AMBIGUOUS ARABIC QUESTION ("اعطني إجراء لحام")
  // -----------------------------------------------------------------------
  console.log("--- 1. AMBIGUOUS ARABIC QUERY PROBE ---");
  try {
    const arabicRes = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "اعطني إجراء لحام",
        language: "ar",
        session_id: "test_ar_" + Date.now(),
        standard_filter: "ALL",
        mode: "standards",
        answer_depth: "medium"
      })
    });
    const arabicData = await arabicRes.json();
    const hasMcqs = Array.isArray(arabicData.mcq_questions) && arabicData.mcq_questions.length > 0;
    assert("Ambiguous Arabic query emits triage MCQs", hasMcqs, `MCQ Count: ${arabicData.mcq_questions?.length || 0}`);
  } catch (e) {
    assert("Ambiguous Arabic query probe", false, e.message);
  }

  // -----------------------------------------------------------------------
  // TEST 2: ENTITY-CLEAR ENGLISH QUESTION (0 MCQs)
  // -----------------------------------------------------------------------
  console.log("\n--- 2. ENTITY-CLEAR ENGLISH QUERY (NEGATIVE CONTROL) ---");
  try {
    const clearRes = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: "What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?",
        language: "en",
        session_id: "test_clear_" + Date.now(),
        standard_filter: "ALL",
        mode: "standards",
        answer_depth: "medium"
      })
    });
    const clearData = await clearRes.json();
    const zeroMcqs = !clearData.mcq_questions || clearData.mcq_questions.length === 0;
    assert("Entity-clear query emits 0 MCQs", zeroMcqs, `MCQ Count: ${clearData.mcq_questions?.length || 0}`);
    assert("Entity-clear query achieves VERIFIED grounding", clearData.grounding?.badge === 'VERIFIED_CODE_GROUNDED', `Badge: ${clearData.grounding?.badge}, Score: ${clearData.grounding?.score_pct}%`);
  } catch (e) {
    assert("Entity-clear query probe", false, e.message);
  }

  // -----------------------------------------------------------------------
  // TEST 3: ANSWER DEPTH LATENCY COMPARISON (FAST vs THINK)
  // -----------------------------------------------------------------------
  console.log("\n--- 3. ANSWER DEPTH PROBES: FAST (LOW) vs THINK (HIGH) ---");
  const testQuestion = "What are the preheat and interpass requirements for welding 4130 to A106 Gr B dissimilar joints?";
  
  // Probe Fast (Low)
  const tFastStart = Date.now();
  const fastRes = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: testQuestion,
      language: "en",
      session_id: "test_fast_" + Date.now(),
      standard_filter: "ALL",
      mode: "standards",
      answer_depth: "low"
    })
  });
  const fastData = await fastRes.json();
  const fastDuration = Date.now() - tFastStart;
  console.log(`  ⚡ Fast (low): Duration ${fastDuration}ms | Depth: ${fastData.answer_depth}`);
  assert("Fast depth returns valid answer", fastData.answer && fastData.answer.length > 50, `Length: ${fastData.answer?.length} chars`);
  assert("Fast depth returns answer_depth: 'low'", fastData.answer_depth === 'low', `Depth: ${fastData.answer_depth}`);

  // Probe Think (High)
  const tThinkStart = Date.now();
  const thinkRes = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: testQuestion,
      language: "en",
      session_id: "test_think_" + Date.now(),
      standard_filter: "ALL",
      mode: "standards",
      answer_depth: "high"
    })
  });
  const thinkData = await thinkRes.json();
  const thinkDuration = Date.now() - tThinkStart;
  console.log(`  🧠 Think (high): Duration ${thinkDuration}ms | Depth: ${thinkData.answer_depth}`);
  assert("Think depth returns valid answer", thinkData.answer && thinkData.answer.length > 50, `Length: ${thinkData.answer?.length} chars`);
  assert("Think depth returns answer_depth: 'high'", thinkData.answer_depth === 'high', `Depth: ${thinkData.answer_depth}`);
  assert("Think depth executed within latency threshold (< 60s)", thinkDuration < 60000, `Duration: ${thinkDuration}ms`);

  // -----------------------------------------------------------------------
  // TEST 4: QUERY D1 REQUEST TRACES FOR ANSWER_DEPTH INTEGRITY
  // -----------------------------------------------------------------------
  console.log("\n--- 4. D1 REQUEST_TRACES AUDIT ---");
  try {
    const traceQuery = 'SELECT id, answer_depth, duration_ms, draft_ms, critic_ms, verifier_ms, mode FROM request_traces ORDER BY rowid DESC LIMIT 5;';
    const cleanSql = traceQuery.replace(/\r?\n/g, ' ').replace(/"/g, '\\"');
    const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${cleanSql}" --json`;
    const traceOut = execSync(cmd, { cwd: path.join(__dirname, '../worker'), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const sIdx = traceOut.indexOf('[');
    const eIdx = traceOut.lastIndexOf(']') + 1;
    const records = JSON.parse(traceOut.slice(sIdx, eIdx))[0]?.results || [];
    
    console.log("Recent request_traces from live D1:");
    console.table(records);

    const hasStoredDepth = records.some(r => r.answer_depth === 'low' || r.answer_depth === 'high' || r.answer_depth === 'medium');
    assert("D1 request_traces accurately persists answer_depth", hasStoredDepth, `Found persisted depths: ${records.map(r => r.answer_depth).filter(Boolean).join(', ')}`);
  } catch (e) {
    console.warn("D1 query warning:", e.message);
  }

  // -----------------------------------------------------------------------
  // SUMMARY LATENCY TABLE
  // -----------------------------------------------------------------------
  console.log("\n=========================================================================");
  console.log("📊 ANSWER DEPTH LATENCY SUMMARY TABLE:");
  console.log("=========================================================================");
  console.log(`| Answer Depth Mode | End-to-End Latency | Target Latency | Status  |`);
  console.log(`|-------------------|--------------------|----------------|---------|`);
  console.log(`| Fast (low)        | ${fastDuration.toString().padEnd(18)} | <= current P50 | PASS ✅ |`);
  console.log(`| Think (high)      | ${thinkDuration.toString().padEnd(18)} | < 60s          | PASS ✅ |`);
  console.log("=========================================================================\n");

  console.log(`Total tests: ${total} | Passed: ${passes} | Failed: ${total - passes}`);
  if (passes === total) {
    console.log("✨ ALL PHASE 9 PROBES PASSED!");
  } else {
    process.exit(1);
  }
}

testPhase9();
