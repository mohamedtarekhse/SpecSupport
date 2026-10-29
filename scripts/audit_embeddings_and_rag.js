// scripts/audit_embeddings_and_rag.js
const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

try {
  const raw = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT count(id) as total_chunks, sum(case when embedding IS NULL or embedding = \'\' then 1 else 0 end) as missing_embeddings FROM standards_chunks"', {
    cwd: workerDir,
    encoding: 'utf8'
  });
  console.log(raw);
} catch (e) {
  console.error(e.message);
}
