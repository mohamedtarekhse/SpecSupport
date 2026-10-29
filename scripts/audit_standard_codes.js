const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

try {
  const raw = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT DISTINCT standard_code, COUNT(*) as cnt FROM standards_chunks GROUP BY standard_code ORDER BY standard_code ASC"', {
    cwd: workerDir,
    encoding: 'utf8'
  });
  console.log(raw);
} catch (e) {
  console.error(e.message);
}
