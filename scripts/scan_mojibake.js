const { execSync } = require('child_process');
const fs = require('fs');

console.log('Querying chunk samples from D1 to inspect mojibake...');

const sql = `
SELECT id, clause, substr(content, 1, 300) as snippet 
FROM standards_chunks 
LIMIT 5;
`;

fs.writeFileSync('worker/temp_mojibake_query.sql', sql, 'utf8');

try {
  const output = execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_mojibake_query.sql --json', {
    cwd: 'worker',
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  
  const jsonStart = output.indexOf('[');
  const jsonEnd = output.lastIndexOf(']') + 1;
  const jsonStr = output.slice(jsonStart, jsonEnd);
  const parsed = JSON.parse(jsonStr);
  console.log('Parsed length:', parsed.length);
  parsed.forEach((p, idx) => console.log(`Item ${idx} keys:`, Object.keys(p), 'results length:', p.results?.length));
  const rows = parsed[0]?.results || [];
  console.log(`Found ${rows.length} sample rows:`);
  rows.slice(0, 10).forEach(r => {
    console.log(`[ID ${r.id}] ${r.clause}:`);
    console.log(`   ${JSON.stringify(r.snippet)}\n`);
  });
} catch (e) {
  console.error('Error running wrangler d1 execute:', e.message);
  if (e.stdout) console.log('STDOUT:', e.stdout);
  if (e.stderr) console.log('STDERR:', e.stderr);
} finally {
  if (fs.existsSync('worker/temp_mojibake_query.sql')) {
    fs.unlinkSync('worker/temp_mojibake_query.sql');
  }
}
