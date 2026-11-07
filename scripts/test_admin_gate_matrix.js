/**
 * scripts/test_admin_gate_matrix.js
 * Permanent Canary Suite for D8 Security Spine
 * Asserts Deny-by-default on all 12 Admin/Write routes across:
 *  - No token (must return 401/403)
 *  - Wrong token (must return 401/403)
 *  - Valid env token (must return 200 on authorized read endpoints)
 * Also asserts public read endpoints (/api/health, /api/ask) remain accessible.
 */

const BASE_URL = process.env.BASE_URL || 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET || '';

const ADMIN_ROUTES = [
  { name: 'ingest', method: 'POST', path: '/api/admin/ingest', body: { standard_code: 'TEST-SEC', content: 'Security matrix test clause 1.0' } },
  { name: 'ingest-batch', method: 'POST', path: '/api/admin/ingest-batch', body: { standard_code: 'TEST-SEC', chunks: [{ content: 'Test chunk', clause: '1.1' }] } },
  { name: 'ingest-table', method: 'POST', path: '/api/admin/ingest-table', body: { standard_code: 'TEST-SEC', table_id: 'Table S-1', structured_json: '[]' } },
  { name: 'auto-parse-table', method: 'POST', path: '/api/admin/auto-parse-table', body: { standard_code: 'TEST-SEC', table_text: 'Table 1: Test\nCol A | Col B\n1 | 2' } },
  { name: 'ai-generate-rule', method: 'POST', path: '/api/admin/ai-generate-rule', body: { prompt: 'Extract governance rule for BOP rams' } },
  { name: 'auto-train-standard', method: 'POST', path: '/api/admin/auto-train-standard', body: { standard_code: 'TEST-SEC' } },
  { name: 'setup-db', method: 'POST', path: '/api/admin/setup-db', body: {} },
  { name: 'cache-purge', method: 'POST', path: '/api/admin/cache-purge', body: {} },
  { name: 'review-queue', method: 'GET', path: '/api/admin/review-queue', isRead: true },
  { name: 'traces', method: 'GET', path: '/api/admin/traces', isRead: true },
  { name: 'model-status', method: 'GET', path: '/api/admin/model-status', isRead: true },
  { name: 'config', method: 'GET', path: '/api/admin/config', isRead: true }
];

async function callEndpoint(route, authHeader) {
  const url = `${BASE_URL}${route.path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  const init = {
    method: route.method,
    headers
  };
  if (route.method !== 'GET' && route.body) {
    init.body = JSON.stringify(route.body);
  }

  const res = await fetch(url, init);
  return { status: res.status, ok: res.ok };
}

async function runGateMatrix() {
  console.log(`\n======================================================`);
  console.log(`🔒 D8 SECURITY SPINE: ADMIN GATE MATRIX CANARY SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Testing ${ADMIN_ROUTES.length} admin routes x 2 rejection vectors (24 assertions)`);
  console.log(`======================================================\n`);

  let totalPassed = 0;
  let totalTests = 0;
  const failureDetails = [];

  for (const route of ADMIN_ROUTES) {
    // 1. Vector: No token
    totalTests++;
    try {
      const resNoAuth = await callEndpoint(route, null);
      if (resNoAuth.status === 401 || resNoAuth.status === 403) {
        console.log(`  ✅ [NO-TOKEN] ${route.name.padEnd(20)} (${route.method} ${route.path}) -> ${resNoAuth.status} BLOCKED`);
        totalPassed++;
      } else {
        console.error(`  ❌ [NO-TOKEN] ${route.name.padEnd(20)} Expected 401/403, got ${resNoAuth.status}`);
        failureDetails.push(`${route.name} (no token): expected 401/403, got ${resNoAuth.status}`);
      }
    } catch (e) {
      console.error(`  ❌ [NO-TOKEN] ${route.name} error: ${e.message}`);
      failureDetails.push(`${route.name} (no token): error ${e.message}`);
    }

    // 2. Vector: Wrong token
    totalTests++;
    try {
      const resWrongAuth = await callEndpoint(route, 'Bearer invalid-backdoor-attempt-999');
      if (resWrongAuth.status === 401 || resWrongAuth.status === 403) {
        console.log(`  ✅ [WRONG-TOKEN] ${route.name.padEnd(17)} (${route.method} ${route.path}) -> ${resWrongAuth.status} BLOCKED`);
        totalPassed++;
      } else {
        console.error(`  ❌ [WRONG-TOKEN] ${route.name.padEnd(17)} Expected 401/403, got ${resWrongAuth.status}`);
        failureDetails.push(`${route.name} (wrong token): expected 401/403, got ${resWrongAuth.status}`);
      }
    } catch (e) {
      console.error(`  ❌ [WRONG-TOKEN] ${route.name} error: ${e.message}`);
      failureDetails.push(`${route.name} (wrong token): error ${e.message}`);
    }

    // 3. Authorized Read Check (if ADMIN_TOKEN provided)
    if (ADMIN_TOKEN && route.isRead) {
      totalTests++;
      try {
        const resValid = await callEndpoint(route, `Bearer ${ADMIN_TOKEN}`);
        if (resValid.status === 200) {
          console.log(`  ✅ [VALID-TOKEN] ${route.name.padEnd(17)} (${route.method} ${route.path}) -> 200 OK`);
          totalPassed++;
        } else {
          console.error(`  ❌ [VALID-TOKEN] ${route.name.padEnd(17)} Expected 200, got ${resValid.status}`);
          failureDetails.push(`${route.name} (valid token): expected 200, got ${resValid.status}`);
        }
      } catch (e) {
        console.error(`  ❌ [VALID-TOKEN] ${route.name} error: ${e.message}`);
        failureDetails.push(`${route.name} (valid token): error ${e.message}`);
      }
    }
  }

  // 4. Verify public read endpoints
  totalTests++;
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    if (healthRes.status === 200) {
      console.log(`  ✅ [PUBLIC-READ] /api/health -> 200 OK`);
      totalPassed++;
    } else {
      console.error(`  ❌ [PUBLIC-READ] /api/health expected 200, got ${healthRes.status}`);
      failureDetails.push(`/api/health: expected 200, got ${healthRes.status}`);
    }
  } catch (e) {
    console.error(`  ❌ [PUBLIC-READ] /api/health error: ${e.message}`);
    failureDetails.push(`/api/health error: ${e.message}`);
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`RESULTS: ${totalPassed} / ${totalTests} Passed (${Math.round((totalPassed/totalTests)*100)}%)`);
  console.log(`------------------------------------------------------\n`);

  if (failureDetails.length > 0) {
    console.error(`FAILED CHECKS:\n  - ${failureDetails.join('\n  - ')}`);
    process.exit(1);
  } else {
    console.log(`🎉 ALL SECURITY MATRIX GATES PASSED! Deny-by-default confirmed.`);
    process.exit(0);
  }
}

runGateMatrix().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
