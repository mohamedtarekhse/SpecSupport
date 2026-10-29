// scripts/debug_retrieval.js
const { execSync } = require('child_process');
const path = require('path');
const workerDir = path.join(__dirname, '../worker');

const question = 'What is the maximum allowable undercut depth for statically loaded welds under AWS D1.1 Table 6.1?';

let stdMatch = question.match(/(ASME\s*(?:VIII|Section\s*VIII|B31\.3|B31\.4|B31\.8|V|IX)|(?:API\s*)?(?:Standard\s*53|Std\s*53|RP\s*53|53|RP\s*4G|Spec\s*4F|4F|RP\s*8B|Spec\s*8C|8C|Spec\s*5CT|5\s*CT|RP\s*5C1|5\s*C1|1104|16\s*D|16\s*A|7\s*K|RP\s*2X|2X|RP\s*7G-2|7\s*G-?2)|IADC(?:\s*WellSharp)?|Cameron(?:\s*Type\s*U)?|Hydril(?:\s*GK)?|Shaffer|Koomey|AWS\s*(?:D1\.1|B1\.11)|ISO\s*(?:3834-2|13534))/i);

console.log('stdMatch[0]:', stdMatch ? stdMatch[0] : null);
console.log('stdMatch[1]:', stdMatch ? stdMatch[1] : null);

let raw = (stdMatch[1] || stdMatch[0]).replace(/Section\s*/i, '').trim().toUpperCase();
raw = raw.replace(/\s+/g, ' ');
if (raw === 'AWS D1.1' || raw === 'AWSD1.1') raw = 'AWS D1.1';
console.log('raw detectedStd:', raw);

// Let's test the FTS match
const ftsTerm = question.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 2).join(" OR ");
console.log('ftsTerm:', ftsTerm);

const ftsSql = `SELECT rowid, bm25(standards_fts) as bm25_score FROM standards_fts WHERE standards_fts MATCH '${ftsTerm}' LIMIT 10`;
try {
  const ftsRes = execSync(`npx.cmd wrangler d1 execute inspection-db --remote --command "${ftsSql}"`, { cwd: workerDir, encoding: 'utf8' });
  console.log('FTS Results:\n', ftsRes);
} catch(e) {
  console.error(e.message);
}
