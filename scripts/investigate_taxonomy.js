// scripts/investigate_taxonomy.js
const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

try {
  const raw = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT id, equipment_category, equipment_name, primary_standard, prohibited_standards FROM standards_taxonomy LIMIT 10"', {
    cwd: workerDir,
    encoding: 'utf8'
  });
  console.log(raw);
} catch (e) {
  console.error(e.message);
}
