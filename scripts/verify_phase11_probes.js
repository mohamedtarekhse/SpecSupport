const https = require('https');
const fs = require('fs');

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'inspect-admin-2026';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runProbes() {
  console.log('===============================================================');
  console.log('🔬 PHASE 11 LIVE PRODUCTION PROBES: ROLE ROUTING & ADMIN SHIELD');
  console.log('Target API:', API_BASE);
  console.log('===============================================================\n');

  const report = {};

  // Probe (d) & (e): Shield verify true / false & model-status
  console.log('[PROBE 1] Shield / Admin Token Verification Endpoint:');
  const unauthConfig = await request('/api/admin/config');
  console.log('  1.1 GET /api/admin/config without token:', unauthConfig.status, unauthConfig.status === 401 ? '✅ PASS (401 Unauthorized)' : '❌ FAIL');

  const invalidConfig = await request('/api/admin/config', {
    headers: { 'Authorization': 'Bearer wrong-secret-token' }
  });
  console.log('  1.2 GET /api/admin/config with invalid token:', invalidConfig.status, invalidConfig.status === 401 ? '✅ PASS (401 Unauthorized)' : '❌ FAIL');

  const validConfig = await request('/api/admin/config', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  console.log('  1.3 GET /api/admin/config with valid token:', validConfig.status, validConfig.status === 200 ? '✅ PASS (200 OK)' : '❌ FAIL');

  const modelStatus = await request('/api/admin/model-status', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  console.log('  1.4 GET /api/admin/model-status with valid token:', modelStatus.status, modelStatus.status === 200 ? '✅ PASS (200 OK)' : '❌ FAIL');
  if (modelStatus.body && modelStatus.body.models) {
    console.log('      Models configured:', modelStatus.body.models);
  }

  // Probe (a): /api/ask public -> traces show provider_role='public' + llama-8b
  console.log('\n[PROBE 2] Public Role /api/ask:');
  const pubSessionId = 'probe_pub_' + Date.now();
  const t0 = Date.now();
  const pubAsk = await request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      question: `Explain the requirement for NDT examiner visual acuity under ISO 9712 [probe-${Date.now()}]`,
      language: 'en',
      session_id: pubSessionId,
      mode: 'standards',
      standard_filter: 'ALL',
      selected_standards: []
    }
  });
  const pubDuration = Date.now() - t0;
  console.log(`  2.1 Public ask status: ${pubAsk.status} (${pubDuration}ms)`);

  // Verify in traces
  await new Promise(r => setTimeout(r, 1200));
  const tracesRes = await request('/api/admin/traces?limit=10', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const recentTraces = tracesRes.body?.traces || [];
  const pubTrace = recentTraces.find(t => t.session_id === pubSessionId);
  if (pubTrace) {
    console.log('  2.2 Public trace verified:');
    console.log(`      provider_role: ${pubTrace.provider_role} (expected: public) ->`, pubTrace.provider_role === 'public' ? '✅ PASS' : '❌ FAIL');
    console.log(`      model: ${pubTrace.model} ->`, pubTrace.model.includes('llama') ? '✅ PASS' : '❌ FAIL');
    report.probe_a = { role: pubTrace.provider_role, model: pubTrace.model, duration_ms: pubTrace.duration_ms };
  } else {
    console.log('  ⚠️ Public trace not found yet in recent traces');
  }

  // Probe (b): /api/ask admin -> traces show provider_role='admin' + glm-5.3-flash
  console.log('\n[PROBE 3] Admin Role /api/ask (X-Admin-Token):');
  const adminSessionId = 'probe_admin_' + Date.now();
  const t1 = Date.now();
  const adminAsk = await request('/api/ask', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Token': ADMIN_SECRET
    },
    body: {
      question: `What are the critical stress fatigue initiation zones on blowout preventers per API 53? [probe-${Date.now()}]`,
      language: 'en',
      session_id: adminSessionId,
      mode: 'standards',
      standard_filter: 'ALL',
      selected_standards: []
    }
  });
  const adminDuration = Date.now() - t1;
  console.log(`  3.1 Admin ask status: ${adminAsk.status} (${adminDuration}ms)`);

  // Verify in traces
  await new Promise(r => setTimeout(r, 1200));
  const tracesRes2 = await request('/api/admin/traces?limit=10', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const recentTraces2 = tracesRes2.body?.traces || [];
  const adminTrace = recentTraces2.find(t => t.session_id === adminSessionId);
  if (adminTrace) {
    console.log('  3.2 Admin trace verified:');
    console.log(`      provider_role: ${adminTrace.provider_role} (expected: admin) ->`, adminTrace.provider_role === 'admin' ? '✅ PASS' : '❌ FAIL');
    console.log(`      model: ${adminTrace.model} ->`, adminTrace.model.includes('glm') ? '✅ PASS' : '❌ FAIL');
    report.probe_b = { role: adminTrace.provider_role, model: adminTrace.model, duration_ms: adminTrace.duration_ms };
  } else {
    console.log('  ⚠️ Admin trace not found yet in recent traces');
  }

  // Probe (c): /api/ask invalid token behaves as public
  console.log('\n[PROBE 4] Invalid Token /api/ask (Behaves as Public):');
  const invSessionId = 'probe_inv_' + Date.now();
  const t2 = Date.now();
  const invAsk = await request('/api/ask', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Token': 'wrong-token-99999'
    },
    body: {
      question: `Explain non-destructive examination principles for visual welding inspections per AWS B1.11 [probe-${Date.now()}]`,
      language: 'en',
      session_id: invSessionId,
      mode: 'standards',
      standard_filter: 'ALL',
      selected_standards: []
    }
  });
  const invDuration = Date.now() - t2;
  console.log(`  4.1 Invalid token ask status: ${invAsk.status} (${invDuration}ms)`);

  await new Promise(r => setTimeout(r, 1200));
  const tracesRes3 = await request('/api/admin/traces?limit=10', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const invTrace = tracesRes3.body?.traces?.find(t => t.session_id === invSessionId);
  if (invTrace) {
    console.log('  4.2 Invalid token trace verified:');
    console.log(`      provider_role: ${invTrace.provider_role} (expected: public) ->`, invTrace.provider_role === 'public' ? '✅ PASS' : '❌ FAIL');
    console.log(`      model: ${invTrace.model} (expected: llama-8b) ->`, invTrace.model.includes('llama') ? '✅ PASS' : '❌ FAIL');
    report.probe_c = { role: invTrace.provider_role, model: invTrace.model, duration_ms: invTrace.duration_ms };
  }

  // Probe (g): Table Fast Path Latency <= 1.5s
  console.log('\n[PROBE 5] Table Fast-Path Invariance Check (<= 1.5s):');
  const tableSessionId = 'probe_table_' + Date.now();
  const t3 = Date.now();
  const tableAsk = await request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      question: 'What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?',
      language: 'en',
      session_id: tableSessionId,
      mode: 'standards',
      standard_filter: 'ALL',
      selected_standards: []
    }
  });
  const tableDuration = Date.now() - t3;
  console.log(`  5.1 Table hit status: ${tableAsk.status}, latency: ${tableDuration}ms ->`, tableDuration <= 1500 ? '✅ PASS' : '❌ FAIL');
  console.log(`      Badge: ${tableAsk.body?.grounding?.badge}, Score: ${tableAsk.body?.grounding?.score_pct}%`);
  report.probe_g = { duration_ms: tableDuration, badge: tableAsk.body?.grounding?.badge, score: tableAsk.body?.grounding?.score_pct };

  // Probe (d) & (f): Nav and Scope Chip in index.html inspection
  console.log('\n[PROBE 6] DOM & Static Assertions (index.html):');
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const hasScopeChip = indexHtml.includes('id="header-scope-chip"');
  const hasShieldBtn = indexHtml.includes('id="admin-shield-btn"');
  const hasAdminOnlyCss = indexHtml.includes('.admin-only {');
  const hasModeSwitchRemoved = !indexHtml.includes('<div class="gemini-mode-switch">');
  const hasAppNameHook = indexHtml.includes('const APP_NAME = window.APP_NAME || "Inspecta";');

  console.log('  6.1 Scope chip in header:', hasScopeChip ? '✅ PASS' : '❌ FAIL');
  console.log('  6.2 Shield icon button in header:', hasShieldBtn ? '✅ PASS' : '❌ FAIL');
  console.log('  6.3 .admin-only display:none default:', hasAdminOnlyCss ? '✅ PASS' : '❌ FAIL');
  console.log('  6.4 Center mode switch removed:', hasModeSwitchRemoved ? '✅ PASS' : '❌ FAIL');
  console.log('  6.5 APP_NAME dynamic hook present:', hasAppNameHook ? '✅ PASS' : '❌ FAIL');

  console.log('\n===============================================================');
  console.log('PROBE RESULTS SUMMARY:', JSON.stringify(report, null, 2));
  console.log('===============================================================');
}

runProbes().catch(console.error);
