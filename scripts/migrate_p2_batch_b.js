const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sqlStatements = [
  // code_safety_envelopes additions
  `ALTER TABLE code_safety_envelopes ADD COLUMN primary_code TEXT;`,
  `ALTER TABLE code_safety_envelopes ADD COLUMN source_chunk_id INTEGER;`,
  `ALTER TABLE code_safety_envelopes ADD COLUMN min_remaining_wall_pct REAL;`,
  `ALTER TABLE code_safety_envelopes ADD COLUMN min_hydrotest_ratio REAL;`,
  `ALTER TABLE code_safety_envelopes ADD COLUMN notes TEXT;`,
  
  // request_traces stage timings
  `ALTER TABLE request_traces ADD COLUMN retrieval_ms INTEGER;`,
  `ALTER TABLE request_traces ADD COLUMN table_ms INTEGER;`,
  `ALTER TABLE request_traces ADD COLUMN draft_ms INTEGER;`,
  `ALTER TABLE request_traces ADD COLUMN critic_ms INTEGER;`,
  `ALTER TABLE request_traces ADD COLUMN verifier_ms INTEGER;`,
  `ALTER TABLE request_traces ADD COLUMN mode TEXT;`
];

for (const stmt of sqlStatements) {
  try {
    const tmpFile = path.join(__dirname, '../worker/temp_col_add.sql');
    fs.writeFileSync(tmpFile, stmt, 'utf8');
    execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_col_add.sql', {
      cwd: path.join(__dirname, '../worker'),
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log(`✓ Executed: ${stmt}`);
    try { fs.unlinkSync(tmpFile); } catch(e){}
  } catch(e) {
    if (e.message && e.message.includes('duplicate column name')) {
      console.log(`ℹ Already exists: ${stmt}`);
    } else {
      console.warn(`Warning on statement: ${stmt} -> ${e.message}`);
    }
  }
}
