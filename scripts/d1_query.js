// d1_query.js — run SELECTs against remote D1 without shell quoting issues
// Usage: node scripts/d1_query.js "SELECT ..."
const { execSync } = require('child_process');
const sql = process.argv[2];
if (!sql) { console.error('Usage: node d1_query.js "<SQL>"'); process.exit(1); }
const cmdline = `npx.cmd wrangler d1 execute inspection-db --remote --json --command "${sql.replace(/"/g, '')}"`;
const out = execSync(cmdline,
  { encoding: 'utf8', cwd: __dirname, maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] });
try {
  const json = JSON.parse(out.slice(out.indexOf('['))); // skip wrangler banner lines
  const rows = json[0]?.results || json;
  console.log(JSON.stringify(rows, null, 1));
} catch (e) {
  console.log(out);
}
