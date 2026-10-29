// scripts/inspect_chunk_schema.js
const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

try {
  const raw = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT id, standard_code, standard_name, section, clause, acceptance_limits, rejection_limits, qa_docs, content FROM standards_chunks WHERE standard_code = \'AWS D1.1\' LIMIT 1"', {
    cwd: workerDir,
    encoding: 'utf8'
  });
  console.log(raw);
} catch (e) {
  console.error(e.message);
}
