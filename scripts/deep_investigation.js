// scripts/deep_investigation.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

function runD1(sql) {
  try {
    const raw = execSync(`npx.cmd wrangler d1 execute inspection-db --remote --command "${sql.replace(/"/g, '\\"')}"`, {
      cwd: workerDir,
      encoding: 'utf8'
    });
    const jsonStart = raw.indexOf('[');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart));
      return parsed[0]?.results || [];
    }
  } catch (e) {
    console.error('SQL Error:', e.message);
  }
  return [];
}

console.log('====================================================');
console.log('🔬 DEEP INVESTIGATION PHASE 1: STANDARDS TABLES IN D1');
console.log('====================================================');
const tablesSummary = runD1('SELECT standard_code, count(id) as table_count FROM standards_tables GROUP BY standard_code ORDER BY table_count DESC');
console.log('Tables in standards_tables:', tablesSummary);

console.log('\n====================================================');
console.log('🔬 DEEP INVESTIGATION PHASE 2: MISSING EMBEDDINGS PER STANDARD');
console.log('====================================================');
const missingEmbByStd = runD1('SELECT standard_code, count(id) as total, sum(case when embedding IS NULL or embedding = \'\' then 1 else 0 end) as missing_emb FROM standards_chunks GROUP BY standard_code HAVING missing_emb > 0 ORDER BY missing_emb DESC');
console.log('Missing Embeddings Breakdown:', missingEmbByStd);

console.log('\n====================================================');
console.log('🔬 DEEP INVESTIGATION PHASE 3: USAGE LOG & ERROR PATTERNS');
console.log('====================================================');
const recentUsage = runD1('SELECT id, session_id, model_used, substr(question, 1, 60) as q, date FROM usage_log ORDER BY id DESC LIMIT 5');
console.log('Recent Usage Log:', recentUsage);
