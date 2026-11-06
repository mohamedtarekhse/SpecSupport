/**
 * scripts/verify_phase12_admin_pin.js
 * Verifies Phase 12: Admin-pin hotfix on answer_depth='low' + raised quality floor.
 */

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_SECRET = 'inspect-admin-2026';

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (e) {}
  return { status: res.status, ok: res.ok, headers: res.headers, text, json };
}

async function run() {
  console.log('===============================================================');
  console.log('🔬 PHASE 12 LIVE VERIFICATION: ADMIN PIN & LOW-DEPTH QUALITY FLOOR');
  console.log('API Target:', API_BASE);
  console.log('===============================================================\n');

  // Use distinct, un-cached questions for Test A and Test B to avoid semantic cache reuse
  const questionA = `Explain the ultrasonic testing angle beam calibration procedure per ASME Section V Article 4. [audit-a-${Date.now()}]`;
  const questionB = `What are the radiographic film density requirements for single-film viewing per ASME Section V Article 2? [audit-b-${Date.now()}]`;

  // (a) /api/ask with valid X-Admin-Token + answer_depth=low
  console.log('[TEST A] Admin Request with answer_depth="low":');
  const sessAdmin = `p12_admin_low_${Date.now()}`;
  const tA0 = Date.now();
  const resAdmin = await request('/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': ADMIN_SECRET
    },
    body: JSON.stringify({
      question: questionA,
      session_id: sessAdmin,
      answer_depth: 'low',
      mode: 'web'
    })
  });
  const tAdminMs = Date.now() - tA0;
  console.log(`  Status: ${resAdmin.status} (${tAdminMs}ms)`);
  if (!resAdmin.ok) {
    console.error('  Response text:', resAdmin.text.slice(0, 300));
  }

  // Check trace for session
  await new Promise(r => setTimeout(r, 800));
  const traceResAdmin = await request(`/api/admin/traces?limit=10`, {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const tracesAdmin = traceResAdmin.json?.traces || [];
  const adminTrace = tracesAdmin.find(t => t.session_id === sessAdmin);
  console.log('  Admin Trace Record:');
  console.log(`    provider_role: ${adminTrace?.provider_role} (expected: admin) -> ${adminTrace?.provider_role === 'admin' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    model: ${adminTrace?.model} (expected: @cf/zai-org/glm-5.3-flash) -> ${adminTrace?.model === '@cf/zai-org/glm-5.3-flash' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    answer_depth: ${adminTrace?.answer_depth}`);

  // (b) Unauthenticated same Q with answer_depth=low
  console.log('\n[TEST B] Unauthenticated (Public) Request with answer_depth="low":');
  const sessPublic = `p12_public_low_${Date.now()}`;
  const tB0 = Date.now();
  const resPublic = await request('/api/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question: questionB,
      session_id: sessPublic,
      answer_depth: 'low',
      mode: 'web'
    })
  });
  const tPublicMs = Date.now() - tB0;
  console.log(`  Status: ${resPublic.status} (${tPublicMs}ms)`);

  await new Promise(r => setTimeout(r, 800));
  const traceResPub = await request(`/api/admin/traces?limit=10`, {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const tracesPub = traceResPub.json?.traces || [];
  const pubTrace = tracesPub.find(t => t.session_id === sessPublic);
  console.log('  Public Trace Record:');
  console.log(`    provider_role: ${pubTrace?.provider_role} (expected: public) -> ${pubTrace?.provider_role === 'public' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    model: ${pubTrace?.model} (expected: @cf/meta/llama-3.1-8b-instruct-fp8-fast) -> ${pubTrace?.model === '@cf/meta/llama-3.1-8b-instruct-fp8-fast' ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`    answer_depth: ${pubTrace?.answer_depth}`);

  // (c) Fast-Path table probe (<=1.5s, 0 LLM)
  console.log('\n[TEST C] Fast-Path Table Probe (<= 1.5s, 0 LLM):');
  const tC0 = Date.now();
  const resTable = await request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?',
      session_id: `p12_table_${Date.now()}`,
      answer_depth: 'low',
      mode: 'standards'
    })
  });
  const tTableMs = Date.now() - tC0;
  console.log(`  Table hit latency: ${tTableMs}ms (threshold: <= 1500ms) -> ${tTableMs <= 1500 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Badge: ${resTable.json?.grounding?.badge}, Score: ${resTable.json?.grounding?.score_pct}%`);

  // (d) Fast-Path Envelope probe (<= 3s)
  console.log('\n[TEST D] Fast-Path Envelope Probe (<= 3.0s):');
  const tD0 = Date.now();
  const resEnv = await request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'What is the minimum preheat temperature for ASTM A106 Grade B pipe under ASME B31.3 Table 330.1.1?',
      session_id: `p12_env_${Date.now()}`,
      answer_depth: 'low',
      mode: 'standards'
    })
  });
  const tEnvMs = Date.now() - tD0;
  console.log(`  Envelope hit latency: ${tEnvMs}ms (threshold: <= 3000ms) -> ${tEnvMs <= 3000 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Badge: ${resEnv.json?.grounding?.badge}, Score: ${resEnv.json?.grounding?.score_pct}%`);

  console.log('\n===============================================================');
  const passA = adminTrace?.provider_role === 'admin' && adminTrace?.model === '@cf/zai-org/glm-5.3-flash';
  const passB = pubTrace?.provider_role === 'public' && pubTrace?.model === '@cf/meta/llama-3.1-8b-instruct-fp8-fast';
  const passC = tTableMs <= 1500;
  const passD = tEnvMs <= 3000;
  const allPass = passA && passB && passC && passD;
  console.log(`PHASE 12 VERIFICATION RESULT: ${allPass ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
  console.log('===============================================================');
}

run().catch(console.error);
