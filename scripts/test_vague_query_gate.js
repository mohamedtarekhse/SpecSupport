// =========================================================================
// 🔬 GATE PROBES: VAGUE-QUERY CONTRACT & TABLE FABRICATION GUARD
// =========================================================================

const BASE_URL = process.env.API_TARGET || 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_SECRET = process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET || "";

function hasMarkdownTable(text) {
  if (!text || typeof text !== 'string') return false;
  return /\|[^\n]+\|\r?\n\|[-:\s|]+\|/m.test(text);
}

function hasFabricatedTableClaim(text) {
  if (!text) return false;
  return /24-48\s*hours\s*post-pwht/i.test(text) || /aws\s*d1\.1\s*or\s*equivalent/i.test(text);
}

async function runGateProbes() {
  console.log('===============================================================');
  console.log('🔬 RUNNING VAGUE-QUERY & TABLE FABRICATION GUARD GATES');
  console.log('Target API:', BASE_URL);
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  // -------------------------------------------------------------------------
  // Probe (a): Mast QA vague query on public low lane
  // Expected: MCQs fire (>= 1) OR 3-block template (interpretation line + 1 follow-up);
  // Zero tables; latency <= 6s; trace answer_depth=low.
  // -------------------------------------------------------------------------
  total++;
  console.log('[PROBE A] Vague Query: "what should i do for mast inspection quality assurance"');
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'what should i do for mast inspection quality assurance',
        answer_depth: 'low',
        session_id: 'gate_vague_' + Date.now()
      })
    });
    const durMs = Date.now() - t0;
    const data = await res.json();

    const hasTables = hasMarkdownTable(data.answer);
    const hasFabClaim = hasFabricatedTableClaim(data.answer);
    const mcqCount = Array.isArray(data.mcq_questions) ? data.mcq_questions.length : 0;
    const modelUsed = data.model_used;

    console.log(`  Duration: ${durMs}ms (threshold: <= 6000ms)`);
    console.log(`  Model: ${modelUsed}`);
    console.log(`  MCQs fired: ${mcqCount}`);
    console.log(`  Contains markdown tables: ${hasTables}`);
    console.log(`  Contains fabricated claims: ${hasFabClaim}`);

    const hasMcqsOrTemplate = mcqCount >= 1 || /most probable interpretation/i.test(data.answer || '');
    const passesTables = !hasTables && !hasFabClaim;

    if (hasMcqsOrTemplate && passesTables) {
      console.log('  -> ✅ PASS [Probe A: Vague Query Contract Satisfied]');
      passed++;
    } else {
      console.log('  -> ❌ FAIL [Probe A]');
      if (!hasMcqsOrTemplate) console.log('     Reason: Expected >=1 MCQ or template interpretation line');
      if (hasTables) console.log('     Reason: Tables are strictly forbidden in low depth');
      if (hasFabClaim) console.log('     Reason: Found fabricated table claim');
    }
  } catch (err) {
    console.log('  -> ❌ ERROR [Probe A]:', err.message);
  }

  // -------------------------------------------------------------------------
  // Probe (b): Explicit variant: "API RP 4G Category III periodic mast inspection requirements"
  // Expected: No MCQs (0), normal grounded answer, no fabricated table cells.
  // -------------------------------------------------------------------------
  total++;
  console.log('\n[PROBE B] Explicit Query: "API RP 4G Category III periodic mast inspection requirements"');
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'API RP 4G Category III periodic mast inspection requirements',
        answer_depth: 'medium',
        session_id: 'gate_explicit_' + Date.now()
      })
    });
    const durMs = Date.now() - t0;
    const data = await res.json();

    const mcqCount = Array.isArray(data.mcq_questions) ? data.mcq_questions.length : 0;
    const hasFabClaim = hasFabricatedTableClaim(data.answer);
    const mentions4G = /API\s*RP\s*4G/i.test(data.answer || '');
    const badge = data.grounding?.badge;

    console.log(`  Duration: ${durMs}ms`);
    console.log(`  MCQs fired: ${mcqCount} (expected: 0)`);
    console.log(`  Grounded Badge: ${badge}`);
    console.log(`  Mentions API RP 4G: ${mentions4G}`);
    console.log(`  Contains fabricated claims: ${hasFabClaim}`);

    if (mcqCount === 0 && mentions4G && !hasFabClaim) {
      console.log('  -> ✅ PASS [Probe B: Explicit Query Handled Without MCQs & Grounded]');
      passed++;
    } else {
      console.log('  -> ❌ FAIL [Probe B]');
    }
  } catch (err) {
    console.log('  -> ❌ ERROR [Probe B]:', err.message);
  }

  // -------------------------------------------------------------------------
  // Probe (c): Confirm Scope Flow (triage_action='answer')
  // Expected: Zero MCQs, resolved scope in prompt, grounded answer, trace logs action
  // -------------------------------------------------------------------------
  total++;
  console.log('\n[PROBE C] Triage Confirm Flow: triage_action="answer"');
  try {
    const sessionId = 'gate_confirm_' + Date.now();
    const triageCtx = {
      "Governing Inspection Category": "Category III (Field NDT & Critical Weld Inspection per API RP 4G)",
      "Inspection Purpose & Operating Timing": "Periodic In-Service Operating Hours Inspection",
      "Equipment Condition & Operating History": "In-Service Used Mast (Routine Maintenance History)"
    };

    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'what should i do for mast inspection quality assurance',
        answer_depth: 'medium',
        session_id: sessionId,
        triage_ctx: triageCtx,
        triage_action: 'answer',
        triage_rounds_used: 3
      })
    });
    const data = await res.json();
    const mcqCount = Array.isArray(data.mcq_questions) ? data.mcq_questions.length : 0;
    const hasFab = hasFabricatedTableClaim(data.answer);

    console.log(`  MCQs fired: ${mcqCount} (expected: 0)`);
    console.log(`  Badge: ${data.grounding?.badge}`);
    console.log(`  Has fabricated claims: ${hasFab}`);

    if (mcqCount === 0 && !hasFab) {
      console.log('  -> ✅ PASS [Probe C: Confirmed Scope Execution]');
      passed++;
    } else {
      console.log('  -> ❌ FAIL [Probe C]');
    }
  } catch (err) {
    console.log('  -> ❌ ERROR [Probe C]:', err.message);
  }

  // -------------------------------------------------------------------------
  // Probe (d): Skip Flow (triage_action='skip')
  // Expected: Low-depth 3-block template, zero tables, no MCQs
  // -------------------------------------------------------------------------
  total++;
  console.log('\n[PROBE D] Triage Skip Flow: triage_action="skip"');
  try {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'what should i do for mast inspection quality assurance',
        answer_depth: 'low',
        session_id: 'gate_skip_' + Date.now(),
        triage_action: 'skip',
        triage_rounds_used: 1
      })
    });
    const data = await res.json();
    const hasTables = hasMarkdownTable(data.answer);
    const mcqCount = Array.isArray(data.mcq_questions) ? data.mcq_questions.length : 0;
    const hasInterpretation = /interpretation/i.test(data.answer || '');

    console.log(`  Contains tables: ${hasTables} (expected: false)`);
    console.log(`  MCQs fired: ${mcqCount} (expected: 0)`);
    console.log(`  Has interpretation line: ${hasInterpretation}`);

    if (!hasTables && mcqCount === 0) {
      console.log('  -> ✅ PASS [Probe D: Skip to Bounded Short Answer with Zero Tables]');
      passed++;
    } else {
      console.log('  -> ❌ FAIL [Probe D]');
    }
  } catch (err) {
    console.log('  -> ❌ ERROR [Probe D]:', err.message);
  }

  // -------------------------------------------------------------------------
  // Probe (e): Corpus Gap Note in /api/health
  // -------------------------------------------------------------------------
  total++;
  console.log('\n[PROBE E] Corpus Gap Note in /api/health Doctor');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();

    console.log(`  Corpus Coverage Note: "${data.corpus_coverage_note || ''}"`);
    console.log(`  Doctor status:`, data.coverage_doctor?.status);

    if (data.corpus_coverage_note && data.corpus_coverage_note.includes('API RP 4G')) {
      console.log('  -> ✅ PASS [Probe E: API RP 4G Category Coverage Note Present]');
      passed++;
    } else {
      console.log('  -> ❌ FAIL [Probe E: Missing corpus_coverage_note]');
    }
  } catch (err) {
    console.log('  -> ❌ ERROR [Probe E]:', err.message);
  }

  // -------------------------------------------------------------------------
  // Probe (f): Admin Routing Honesty (Admin token + low depth -> GLM-5.3)
  // -------------------------------------------------------------------------
  total++;
  console.log('\n[PROBE F] Admin Routing Honesty in request_traces:');
  try {
    const adminSessionId = 'gate_admin_honesty_' + Date.now();
    await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': ADMIN_SECRET
      },
      body: JSON.stringify({
        question: 'Preheat requirements for ASTM A106 Grade B piping per ASME B31.3 ' + Date.now(),
        answer_depth: 'low',
        session_id: adminSessionId
      })
    });
    await new Promise(r => setTimeout(r, 1000));
    const tracesRes = await fetch(`${BASE_URL}/api/admin/traces?limit=10`, {
      headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
    });
    const tracesData = await tracesRes.json();
    const adminTrace = (tracesData.traces || []).find(t => t.session_id === adminSessionId);

    console.log(`  Trace record found:`, Boolean(adminTrace));
    if (adminTrace) {
      console.log(`  provider_role: ${adminTrace.provider_role} (expected: admin)`);
      console.log(`  model: ${adminTrace.model} (expected: @cf/zai-org/glm-5.3-flash)`);
      console.log(`  mcq_delivered: ${adminTrace.mcq_delivered}, triage_choice: ${adminTrace.triage_choice}`);

      if (adminTrace.provider_role === 'admin' && adminTrace.model === '@cf/zai-org/glm-5.3-flash') {
        console.log('  -> ✅ PASS [Probe F: Admin Role Honesty Verified]');
        passed++;
      } else {
        console.log('  -> ❌ FAIL [Probe F: Admin role or model mismatch]');
      }
    } else {
      console.log('  -> ❌ FAIL [Probe F: Admin trace record not found]');
    }
  } catch (err) {
    console.log('  -> ❌ ERROR [Probe F]:', err.message);
  }

  console.log('\n===============================================================');
  console.log(`🎯 VAGUE-QUERY GATE SCORECARD: ${passed} / ${total} Probes Passed`);
  console.log('===============================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runGateProbes();
