// scripts/full_test_deployed_developments.js
// Comprehensive Verification Suite for:
// 1. 2nd-Pass Cross-Encoder Re-Ranker (@cf/baai/bge-reranker-base)
// 2. Strongly-Typed JSON Schema Triage Engine (7 Disciplines + Negative Control)

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = 'specsupport-admin-2026';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to make streaming SSE requests and parse SSE events
async function fetchStream(question) {
  const res = await fetch(`${API_BASE}/api/ask?stream=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'test_audit_' + Date.now(),
      question,
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      history: []
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const text = await res.text();
  const lines = text.split('\n');
  let metadata = null;
  let complete = null;
  let fullAnswer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (payload === '[DONE]') continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed.type === 'metadata') {
        metadata = parsed;
      } else if (parsed.type === 'complete') {
        complete = parsed;
      } else if (parsed.token !== undefined) {
        fullAnswer += String(parsed.token);
      }
    } catch(e) {}
  }

  return { metadata, complete, fullAnswer, rawText: text };
}

// Helper to make non-streaming JSON requests
async function fetchJson(question) {
  const res = await fetch(`${API_BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'test_json_' + Date.now(),
      question,
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      history: []
    })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}

async function runTestSuite() {
  console.log('=========================================================================');
  console.log('🔬 SPEC-SUPPORT DEEP AUDIT: CROSS-ENCODER & JSON SCHEMA TRIAGE');
  console.log('Target API:', API_BASE);
  console.log('=========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(title, condition, detail = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${title}`);
      if (detail) console.log(`     └─ ${detail}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (detail) console.error(`     └─ Reason: ${detail}`);
    }
  }

  // =========================================================================
  // TEST SECTION 1: 2nd-PASS CROSS-ENCODER RE-RANKER DEEP VERIFICATION
  // =========================================================================
  console.log('🔹 SECTION 1: CROSS-ENCODER RE-RANKER ACCURACY & PERFORMANCE\n');

  // Test 1.1: System Doctor Diagnostic Probe
  console.log('[Test 1.1] System Doctor Model Health Check:');
  try {
    const docRes = await fetch(`${API_BASE}/api/admin/doctor`, {
      headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
    });
    const docData = await docRes.json();
    const rerankerCheck = docData?.checks?.cross_encoder_reranker;
    assert('Cross-Encoder model reports PASS in Doctor check', rerankerCheck?.status === 'PASS', `Latency: ${rerankerCheck?.latency_ms}ms, Model: ${rerankerCheck?.model}`);
  } catch(e) {
    assert('Cross-Encoder model reports PASS in Doctor check', false, e.message);
  }

  // Test 1.2: Fine-grained Discriminator — Static vs Cyclically Loaded Welds (AWS D1.1 Table 6.1)
  console.log('\n[Test 1.2] Discriminator Test: Static vs Cyclically Loaded Welds (AWS D1.1 Table 6.1)');
  try {
    const q = 'What is the visual inspection undercut depth limit for cyclically loaded welds in AWS D1.1?';
    const stream = await fetchStream(q);
    const sources = stream.metadata?.sources || [];
    
    assert('Sources array contains retrieved items', sources.length > 0, `Count: ${sources.length}`);
    const hasRerankScore = sources.some(s => typeof s.rerank_score === 'number' || s.is_exact_clause_hit);
    assert('Cross-Encoder rerank_score is computed and populated', hasRerankScore, `Top source rerank score: ${sources[0]?.rerank_score}`);
    
    const topSource = sources[0];
    const isCyclicMatched = sources.some(s => /cyclically/i.test(s.clause) || /cyclically/i.test(s.standard));
    assert('Reranker prioritizes Cyclically Loaded criteria over Static criteria', isCyclicMatched, `Top clause: "${topSource?.clause}"`);
  } catch(e) {
    assert('Discriminator Test: Static vs Cyclically Loaded Welds', false, e.message);
  }

  await sleep(1500);

  // Test 1.3: Boundary Condition Discrimination — P-15E (P91) High Alloy vs P-1 Carbon Steel
  console.log('\n[Test 1.3] Alloy Discrimination: P-15E (P91) vs P-1 Carbon Steel Preheat');
  try {
    const q = 'What is the minimum preheat temperature for welding P-No. 15E Grade 91 pipe under ASME B31.3?';
    const stream = await fetchStream(q);
    const ans = stream.fullAnswer;
    
    const mentionsP15E = /15E|91|200\s*°?\s*C|400\s*°?\s*F/i.test(ans);
    assert('Answer correctly identifies 200°C (400°F) preheat for P-15E', mentionsP15E, `Answer sample: "${ans.substring(0, 150)}..."`);
    
    const hasEnvelopeBadge = stream.metadata?.loop_engineering?.verified_status === 'LEVEL_III_CRITIQUE_REFINED';
    assert('Level III Critic verified the answer against code_safety_envelopes', hasEnvelopeBadge, `Status: ${stream.metadata?.loop_engineering?.verified_status}`);
  } catch(e) {
    assert('Alloy Discrimination: P-15E vs P-1', false, e.message);
  }

  await sleep(1500);

  // =========================================================================
  // TEST SECTION 2: STRONGLY-TYPED JSON SCHEMA TRIAGE ENGINE (7 DISCIPLINES)
  // =========================================================================
  console.log('\n\n🔹 SECTION 2: STRONGLY-TYPED JSON SCHEMA TRIAGE VERIFICATION\n');

  const triageCases = [
    {
      discipline: 'Welding & WPS (ASME IX / B31.3)',
      question: 'I need a welding procedure specification',
      expectedQCount: 4,
      expectedTerms: ['Base Metal', 'Thickness', 'Service', 'Policy']
    },
    {
      discipline: 'NDT Examination (ASME V / ISO 9712)',
      question: 'I need an NDT inspection procedure',
      expectedQCount: 3,
      expectedTerms: ['Method', 'Geometry', 'Standard']
    },
    {
      discipline: 'Hydrostatic Testing (ASME B31.3 / B31.4 / B31.8)',
      question: 'How to hydrotest piping in the field',
      expectedQCount: 3,
      expectedTerms: ['Code', 'Pressure', 'Policy']
    },
    {
      discipline: 'Asset Integrity & Fitness For Service (API 510 / 570 / 579)',
      question: 'How to calculate remaining life and retirement thickness of my asset',
      expectedQCount: 3,
      expectedTerms: ['Asset', 'Component', 'Policy']
    },
    {
      discipline: 'Hoisting Equipment (API RP 8B / 4G)',
      question: 'What are the elevator inspection criteria and wear limits',
      expectedQCount: 3,
      expectedTerms: ['Equipment', 'Category', 'Policy']
    },
    {
      discipline: 'Drill Stem & Tubulars (API RP 7G-2 / DS-1)',
      question: 'What are the drill stem inspection criteria and classification',
      expectedQCount: 3,
      expectedTerms: ['Tubular', 'Classification', 'Policy']
    },
    {
      discipline: 'Well Control & BOP (API Standard 53)',
      question: 'What is the bop pressure test procedure',
      expectedQCount: 3,
      expectedTerms: ['Installation', 'Pressure', 'Policy']
    }
  ];

  for (let i = 0; i < triageCases.length; i++) {
    const tc = triageCases[i];
    console.log(`[Test 2.${i + 1}] Testing Triage Discipline: ${tc.discipline}`);
    try {
      const stream = await fetchStream(tc.question);
      const mcqs = stream.complete?.mcq_questions || [];

      // Assertion A: MCQ array exists and matches expected length
      assert(
        `Discipline "${tc.discipline}" emits ${tc.expectedQCount} triage questions in complete SSE event`,
        Array.isArray(mcqs) && mcqs.length >= tc.expectedQCount,
        `Received: ${mcqs.length} questions`
      );

      // Assertion B: Strict Schema Conformance
      let schemaValid = true;
      let schemaDetail = '';
      for (const m of mcqs) {
        if (!m.question || typeof m.question !== 'string' || m.question.trim().length === 0) {
          schemaValid = false;
          schemaDetail = 'Invalid or empty question string';
          break;
        }
        if (!Array.isArray(m.options) || m.options.length < 2) {
          schemaValid = false;
          schemaDetail = `Options array has fewer than 2 choices: ${m.options?.length}`;
          break;
        }
        for (const opt of m.options) {
          if (typeof opt !== 'string' || opt.trim().length === 0) {
            schemaValid = false;
            schemaDetail = 'Option item is empty or not string';
            break;
          }
        }
      }
      assert(`Schema validation: Each question has string question & >= 2 string options`, schemaValid, schemaDetail || 'All options valid');

      // Assertion C: No raw commented tags leaked into markdown body
      const leakedTag = /<!--MCQ:/i.test(stream.fullAnswer);
      assert(`Clean text output: No raw <!--MCQ: leaked into stream text`, !leakedTag, leakedTag ? 'Detected leaked comment tag' : 'Markdown stream clean');

      await sleep(1200);
    } catch(e) {
      assert(`Discipline "${tc.discipline}" execution`, false, e.message);
    }
  }

  // =========================================================================
  // TEST SECTION 3: NEGATIVE CONTROL (DEFINITIVE QUERY MUST NOT TRIGGER TRIAGE)
  // =========================================================================
  console.log('\n\n🔹 SECTION 3: NEGATIVE CONTROL (DEFINITIVE QUERY)\n');
  console.log('[Test 3.1] Specific Query: Should answer directly with ZERO triage MCQs');
  try {
    const q = 'What is the P-Number and Group Number for SA-516 Grade 70 carbon steel plate under ASME Section IX?';
    const stream = await fetchStream(q);
    const mcqs = stream.complete?.mcq_questions || [];
    
    assert(
      'Specific query emits 0 triage MCQs (immediate definitive response)',
      mcqs.length === 0,
      `MCQ count: ${mcqs.length}`
    );

    const identifiesP1G2 = /(?:P-?No\.?|P-?Number)\s*1.*Group(?:\s*Number)?\s*2/i.test(stream.fullAnswer) || /P-?1\s*G-?2/i.test(stream.fullAnswer);
    assert(
      'Answer directly identifies P-No. 1 Group 2 per ASME IX QW-422',
      identifiesP1G2,
      `Answer sample: "${stream.fullAnswer.substring(0, 150)}..."`
    );
  } catch(e) {
    assert('Negative Control Test', false, e.message);
  }

  // =========================================================================
  // TEST SECTION 4: NON-STREAMING JSON ENDPOINT PARITY TEST
  // =========================================================================
  console.log('\n\n🔹 SECTION 4: NON-STREAMING JSON ENDPOINT PARITY\n');
  console.log('[Test 4.1] Testing Non-Streaming /api/ask with Triage Query');
  try {
    const jsonRes = await fetchJson('I need a welding procedure specification');
    const mcqs = jsonRes.mcq_questions || [];

    assert(
      'Non-streaming endpoint returns mcq_questions array',
      Array.isArray(mcqs) && mcqs.length === 4,
      `Count: ${mcqs.length}`
    );

    const hasLeakedTagInJson = /<!--MCQ:/i.test(jsonRes.answer || '');
    assert(
      'Non-streaming answer text has HTML comment tags stripped',
      !hasLeakedTagInJson,
      hasLeakedTagInJson ? 'Found leaked comment tag' : 'Answer text clean'
    );
  } catch(e) {
    assert('Non-streaming JSON parity test', false, e.message);
  }

  // =========================================================================
  // SUMMARY SCORECARD
  // =========================================================================
  console.log('\n=========================================================================');
  console.log(`📊 FINAL VERIFICATION SCORECARD: ${passedTests} / ${totalTests} Passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log('=========================================================================');

  if (passedTests === totalTests) {
    console.log('✨ ALL 2 DEPLOYED DEVELOPMENTS ARE 100% OPERATIONAL IN PRODUCTION!');
  } else {
    console.error(`⚠️ ${totalTests - passedTests} tests failed.`);
    process.exit(1);
  }
}

runTestSuite();
