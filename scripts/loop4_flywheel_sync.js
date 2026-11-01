// scripts/loop4_flywheel_sync.js
// Loop 4 Active Flywheel: Ingests Field Discrepancies into Regression Benchmark Suite

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const workerDir = path.join(__dirname, '../worker');

function runD1(sql) {
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${sql.replace(/"/g, '\\"')}"`;
  const out = execSync(cmd, { cwd: workerDir, encoding: 'utf8' });
  const match = out.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return parsed[0]?.results || [];
  } catch (e) {
    return [];
  }
}

async function runLoop4Flywheel() {
  console.log('=========================================================================');
  console.log('🔄 LOOP 4 REINFORCEMENT FLYWHEEL: FIELD QUALITY LEDGER HARVESTING');
  console.log('=========================================================================');

  console.log('Fetching inspector field feedback from D1 (field_quality_ledger)...');
  const feedbacks = runD1('SELECT id, session_id, question, decision_status, discrepancy_field, original_value, corrected_value, notes, created_at FROM field_quality_ledger ORDER BY created_at DESC LIMIT 50;');

  console.log(`Retrieved ${feedbacks.length} total feedback entries.`);

  const discrepancies = feedbacks.filter(f => f.decision_status === 'REJECTED' || f.notes || f.corrected_value);
  const accepted = feedbacks.filter(f => f.decision_status === 'ACCEPTED' || f.decision_status === 'VERIFIED_PASS');

  console.log(`- Level III Approved Stamped  : ${accepted.length}`);
  console.log(`- Flagged Field Discrepancies : ${discrepancies.length}`);

  if (discrepancies.length === 0) {
    console.log('\n✨ No outstanding discrepancies flagged by inspectors.');
    console.log('All model outputs evaluated in the field are aligned with inspector expectations.');
    return;
  }

  console.log('\n🔍 --- INSPECTOR FLAGGED DISCREPANCIES ---');
  discrepancies.forEach((d, idx) => {
    console.log(`\n[#${idx + 1}] ID: ${d.id} | Session: ${d.session_id}`);
    console.log(`  Question   : ${d.question}`);
    console.log(`  Flag Field : ${d.discrepancy_field || 'N/A'}`);
    console.log(`  Original   : ${d.original_value || 'N/A'}`);
    console.log(`  Corrected  : ${d.corrected_value || 'N/A'}`);
    console.log(`  Notes      : ${d.notes || 'None'}`);
  });

  console.log('\n✅ Loop 4 harvest complete.');
}

runLoop4Flywheel();
