// scripts/defrag_standard_codes.js
const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

function runD1(sql) {
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${sql.replace(/"/g, '\\"')}"`;
  console.log('Executing:', sql);
  const out = execSync(cmd, { cwd: workerDir, encoding: 'utf8' });
  console.log(out);
  return out;
}

console.log('--- Step 1: De-fragmenting standards_chunks codes ---');
runD1("UPDATE standards_chunks SET standard_code = 'ASME VIII DIV 1', standard_name = 'ASME Boiler and Pressure Vessel Code Section VIII Division 1' WHERE LOWER(TRIM(standard_code)) = 'asme viii';");
runD1("UPDATE standards_chunks SET standard_code = 'API RP 4G', standard_name = 'Recommended Practice for Maintenance and Use of Drilling and Well Servicing Structures' WHERE standard_code IN ('API-RP-4G', 'API Spec 4F / API RP 4G');");
runD1("UPDATE standards_chunks SET standard_code = 'TH HILL DS-1 VOL 3', standard_name = 'TH Hill Standard DS-1 Volume 3: Drill Stem Inspection' WHERE standard_code = 'ds1 vol3';");
runD1("UPDATE standards_chunks SET standard_code = 'NEBOSH IGC', standard_name = 'NEBOSH International General Certificate in Occupational Health and Safety' WHERE standard_code LIKE '%nebosh%';");

console.log('--- Step 2: Verification of distinct codes ---');
const verify = execSync('npx.cmd wrangler d1 execute inspection-db --remote --command "SELECT DISTINCT standard_code, COUNT(*) as cnt FROM standards_chunks GROUP BY standard_code ORDER BY cnt DESC LIMIT 15"', {
  cwd: workerDir,
  encoding: 'utf8'
});
console.log(verify);
