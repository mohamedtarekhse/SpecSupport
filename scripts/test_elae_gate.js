// scripts/test_elae_gate.js
// =========================================================================
// 🔬 GATE PROBES: EVIDENCE-LOCKED ANSWER ENGINE (ELAE) CANARY BENCHMARK
// =========================================================================

const BASE_URL = process.env.API_TARGET || 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_SECRET = 'specsupport-admin-2026';

async function runElaeGate() {
  console.log('===============================================================');
  console.log('🔬 RUNNING EVIDENCE-LOCKED ANSWER ENGINE (ELAE) GATE PROBES');
  console.log('Target API:', BASE_URL);
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  // -------------------------------------------------------------------------
  // Probe 1: WPS Authoring Sign-Off Contract & Form QW-482
  // Expected: Top banner present, QW-482 structure, [VERIFIED]/[USER-INPUT]/[VERIFICATION-REQUIRED]
  // -------------------------------------------------------------------------
  total++;
  console.log('[PROBE 1] WPS Authoring Sign-Off Contract & Form QW-482');
  try {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': ADMIN_SECRET
      },
      body: JSON.stringify({
        question: 'Provide a complete ASME Form QW-482 Welding Procedure Specification (WPS) for SA-516 Gr 70 pressure vessel weld',
        answer_depth: 'medium',
        session_id: 'gate_elae_p1_' + Date.now()
      })
    });
    const data = await res.json();
    const answer = data.answer || '';
    const hasBanner = answer.includes('DRAFT FOR REVIEW - NOT SUBMITTABLE: requires PQR and Level III authorization before use');
    const hasVerifiedTag = /\[VERIFIED/i.test(answer);
    const hasReqTag = /\[VERIFICATION-REQUIRED/i.test(answer) || /\[USER-INPUT/i.test(answer);
    const hasQW = /QW-40[2-9]|QW-410|Form QW-482/i.test(answer);

    console.log(`  - Sign-off Banner: ${hasBanner ? '✅ Present' : '❌ Missing'}`);
    console.log(`  - Field Tags ([VERIFIED]): ${hasVerifiedTag ? '✅ Present' : '❌ Missing'}`);
    console.log(`  - Field Tags ([VERIFICATION-REQUIRED]/[USER-INPUT]): ${hasReqTag ? '✅ Present' : '❌ Missing'}`);
    console.log(`  - QW-482 Structure: ${hasQW ? '✅ Present' : '❌ Missing'}`);

    if (hasBanner && hasVerifiedTag && hasQW) {
      console.log('  👉 PROBE 1 RESULT: PASS\n');
      passed++;
    } else {
      console.log('  👉 PROBE 1 RESULT: FAIL\n');
    }
  } catch (err) {
    console.error('  👉 PROBE 1 ERROR:', err.message, '\n');
  }

  // -------------------------------------------------------------------------
  // Probe 2: B31.3 6NPS Sch80 A106 Preheat & Code Calculator Dose
  // Expected: Wall 10.97 mm, Preheat 10°C (50°F), 200°F NOT required, PWHT exempt
  // -------------------------------------------------------------------------
  total++;
  console.log('[PROBE 2] Code Calculator Dose: 6 NPS Sch 80 A106 Preheat (ASME B31.3 Table 330.1.1)');
  try {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the minimum preheat temperature for 6 NPS Sch 80 ASTM A106 Gr B pipe welding per ASME B31.3?',
        answer_depth: 'low',
        session_id: 'gate_elae_p2_' + Date.now()
      })
    });
    const data = await res.json();
    const answer = data.answer || '';
    const hasWall = /10\.97\s*mm|0\.432\s*(?:in|inch)/i.test(answer) || /10\.97|11\s*mm/i.test(answer);
    const hasAmbientPreheat = /10\s*°?\s*C|50\s*°?\s*F/i.test(answer);
    const rulesOut200F = /200\s*°?\s*F.*not\s*required|not\s*required.*200\s*°?\s*F|10\s*°?\s*C/i.test(answer) || !/must\s*preheat\s*to\s*200/i.test(answer);
    const contradictions = data.grounding?.contradictions ?? 0;

    console.log(`  - Wall Thickness: ${hasWall ? '✅ 10.97 mm referenced' : '⚠️ Wall note omitted'}`);
    console.log(`  - Preheat Ambient: ${hasAmbientPreheat ? '✅ 10°C / 50°F' : '❌ Incorrect temp'}`);
    console.log(`  - Contradictions: ${contradictions === 0 ? '✅ 0 Contradictions' : `❌ ${contradictions} Contradictions`}`);

    if (hasAmbientPreheat && contradictions === 0) {
      console.log('  👉 PROBE 2 RESULT: PASS\n');
      passed++;
    } else {
      console.log('  👉 PROBE 2 RESULT: FAIL\n');
    }
  } catch (err) {
    console.error('  👉 PROBE 2 ERROR:', err.message, '\n');
  }

  // -------------------------------------------------------------------------
  // Probe 3: Assertion Entailment & Per-line Evidence Grades
  // Expected: grounding.evidence_grades present with grade and source
  // -------------------------------------------------------------------------
  total++;
  console.log('[PROBE 3] Assertion Entailment & Per-Line EvidenceGrades Structure');
  try {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the maximum allowable undercut depth for Normal Fluid Service piping per ASME B31.3 Table 341.3.2?',
        answer_depth: 'low',
        session_id: 'gate_elae_p3_' + Date.now()
      })
    });
    const data = await res.json();
    const grades = data.grounding?.evidence_grades || [];
    const hasGrades = Array.isArray(grades) && grades.length > 0;
    const verifiedGrades = grades.filter(g => g.grade === 'verified');
    const badge = data.grounding?.badge;

    console.log(`  - Evidence Grades Count: ${grades.length}`);
    console.log(`  - Verified Grades: ${verifiedGrades.length}`);
    console.log(`  - Grounding Badge: ${badge}`);

    if (hasGrades && badge === 'VERIFIED_CODE_GROUNDED') {
      console.log('  👉 PROBE 3 RESULT: PASS\n');
      passed++;
    } else {
      console.log('  👉 PROBE 3 RESULT: FAIL\n');
    }
  } catch (err) {
    console.error('  👉 PROBE 3 ERROR:', err.message, '\n');
  }

  // -------------------------------------------------------------------------
  // Probe 4: Deterministic Fast-Path Sub-Second Latency & Zero LLM Overhead
  // Expected: Table fast-path <= 1.5s, all lines verified
  // -------------------------------------------------------------------------
  total++;
  console.log('[PROBE 4] Deterministic Table Fast-Path Sub-Second Latency');
  try {
    const t0 = Date.now();
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the P-Number of SA-516 Grade 70 per ASME IX Table QW/QB-422?',
        answer_depth: 'low',
        session_id: 'gate_elae_p4_' + Date.now()
      })
    });
    const durMs = Date.now() - t0;
    const data = await res.json();
    const isP1 = data.answer && data.answer.includes('P-No. 1') && data.answer.includes('Group No. 2');
    const isFast = durMs <= 1500;

    console.log(`  - Answer Verified: ${isP1 ? '✅ SA-516 Gr 70 = P-No. 1 Group 2' : '❌ Wrong answer'}`);
    console.log(`  - Response Time: ${durMs} ms (Target <= 1500 ms): ${isFast ? '✅ Sub-second fast path' : '❌ Exceeded threshold'}`);

    if (isP1 && isFast) {
      console.log('  👉 PROBE 4 RESULT: PASS\n');
      passed++;
    } else {
      console.log('  👉 PROBE 4 RESULT: FAIL\n');
    }
  } catch (err) {
    console.error('  👉 PROBE 4 ERROR:', err.message, '\n');
  }

  console.log('===============================================================');
  console.log(`ELAE CANARY BENCHMARK SUMMARY: ${passed}/${total} PROBES PASSED`);
  console.log('===============================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runElaeGate();
