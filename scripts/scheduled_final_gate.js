// scripts/scheduled_final_gate.js
// Self-driving final verification gate for the QW-422 root-cause fix.
// Waits for the Cloudflare Workers AI daily-neuron allocation to reset (UTC midnight),
// then runs: 14 golden evals + 31-test verification suite + 60-question retrieval,
// saves a combined report and auto-commits/pushes it to branch `final`.
const { execSync } = require('child_process');
const { setTimeout: sleep } = require('timers');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = 'specsupport-admin-2026';
const REPORT_PATH = path.join(ROOT, '.eval_history', 'FINAL_GATE_REPORT.md');
const DEADLINE = Date.now() + 8 * 60 * 60 * 1000; // give up after 8h (07:00Z safest)
const POLL_MS = 10 * 60 * 1000;

function nowIso() { return new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'; }

async function healthReady() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/doctor`, { headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` } });
    const j = await res.json();
    const emb = j?.checks?.embedding_ai?.status === 'PASS';
    const cee = j?.checks?.cross_encoder_reranker?.status === 'PASS';
    return emb && cee;
  } catch { return false; }
}

function runStep(label, file) {
  console.log(`\n===== ${label} =====`);
  try {
    return execSync(`node ${file}`, { cwd: ROOT, encoding: 'utf8', timeout: 30 * 60 * 1000 });
  } catch (e) {
    return String(e.stdout || '') + String(e.stderr || '') + `\n[EXIT code non-zero for ${file}]`;
  }
}

async function main() {
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  console.log(`[scheduled_final_gate] started at ${nowIso()}`);
  while (Date.now() < DEADLINE) {
    if (await healthReady()) break;
    console.log(`${nowIso()} — Workers AI allocation still exhausted; next poll in 10 min.`);
    await sleep(POLL_MS);
  }
  const ready = await healthReady();
  const lines = [
    `# FINAL GATE REPORT — Scheduled post-quota-reset verification`,
    `Run completed: ${nowIso()}`,
    `Health gate at start: embedding_ai + cross_encoder_reranker = ${ready ? 'PASS' : 'NOT RECOVERED (FAIL)'}`,
    ``
  ];

  if (ready) {
    const g = runStep('LOOP 3 · GOLDEN EVALS', 'scripts/run_golden_evals.js');
    const s = runStep('DEEP AUDIT · 31-TEST SUITE', 'scripts/full_test_deployed_developments.js');
    const r = runStep('RETRIEVAL · 60 QUESTIONS', 'scripts/evaluate_60_retrieval_questions.js');
    lines.push('## 1. Golden Evals (raw scorecard tail)');
    lines.push('```'); lines.push(g.split('\n').slice(-14).join('\n')); lines.push('```');
    lines.push('## 2. 31-Test Deep Audit (results)');
    lines.push('```'); lines.push(s); lines.push('```');
    lines.push('## 3. Retrieval 60Q (heading + tail)');
    lines.push('```'); lines.push(r.split('\n').slice(0, 6).join('\n') + '\n...\n'); lines.push('```');
    const combined = lines.join('\n');
    fs.writeFileSync(REPORT_PATH, combined, 'utf8');
    console.log(combined);

    // auto-commit + push so the user never runs commands
    try {
      execSync('git add .eval_history/FINAL_GATE_REPORT.md scripts/ingest_asme_ix_qw422_materials.js scripts/d1_query.js worker/src/index.js', { cwd: ROOT, encoding: 'utf8' });
      execSync(`git commit -m "test(final-gate): scheduled post-quota-reset verification of QW-422 material retrieval fix"`, { cwd: ROOT, encoding: 'utf8' });
      const push = execSync('git push origin final', { cwd: ROOT, encoding: 'utf8' });
      console.log(push);
    } catch (e) {
      console.log('git auto-push skipped:', String(e.stdout || '') + String(e.stderr || ''));
    }
  } else {
    lines.push('Workers AI allocation did not recover within the 8-hour window. No authoritative verdict.');
    fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
  }
}

main();
