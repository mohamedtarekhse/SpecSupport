const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

try {
  const raw = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT * FROM code_safety_envelopes"', {
    cwd: workerDir,
    encoding: 'utf8'
  });
  console.log(raw);
} catch (e) {
  console.error(e.message);
}
