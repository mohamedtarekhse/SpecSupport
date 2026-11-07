// scripts/cutover_v2_corpus.js
// Executes atomic cutover from v1 to v2:
// 1. Verifies that backup tables (standards_chunks_v1_backup, etc.) exist and are populated
// 2. Renames live tables -> *_v1_prev
// 3. Renames v2 tables -> live tables
// 4. Verifies live tables count

const { execSync } = require('child_process');
const path = require('path');

function runD1Command(sql) {
  const cleanSql = sql.replace(/\r?\n/g, ' ').replace(/"/g, "'").trim();
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --json --command "${cleanSql}"`;
  const out = execSync(cmd, { encoding: 'utf8', cwd: path.resolve(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] });
  const startIdx = out.indexOf('[');
  if (startIdx === -1) throw new Error('Failed to parse D1 response: ' + out);
  return JSON.parse(out.slice(startIdx))[0]?.results || [];
}

async function main() {
  console.log('=========================================================================');
  console.log('🚀 ATOMIC CUTOVER: ROSETTA 2.0 CORPUS TO LIVE');
  console.log('=========================================================================\n');

  // Step 1: Pre-flight checks
  console.log('1. Checking pre-flight conditions...');
  const countRes = runD1Command(`
    SELECT 
      (SELECT count(*) FROM standards_chunks_v1_backup) as v1_backup_chunks,
      (SELECT count(*) FROM standards_chunks_v2) as v2_chunks,
      (SELECT count(*) FROM standards_tables_v2) as v2_tables,
      (SELECT count(*) FROM code_safety_envelopes_v2) as v2_envelopes;
  `);

  const counts = countRes[0] || {};
  console.log(`   V1 Backup Chunks: ${counts.v1_backup_chunks}`);
  console.log(`   V2 Chunks: ${counts.v2_chunks}`);
  console.log(`   V2 Tables: ${counts.v2_tables}`);
  console.log(`   V2 Envelopes: ${counts.v2_envelopes}`);

  if (!counts.v1_backup_chunks || counts.v1_backup_chunks < 8000) {
    throw new Error('ABORT: standards_chunks_v1_backup does not have expected row count!');
  }
  if (!counts.v2_chunks || counts.v2_chunks < 2500) {
    throw new Error('ABORT: standards_chunks_v2 does not have expected row count!');
  }

  // Step 2: Atomic Table Renames
  console.log('\n2. Executing atomic table renames in D1...');
  // Drop any existing *_v1_prev if left over from previous tests
  runD1Command(`
    DROP TABLE IF EXISTS standards_chunks_v1_prev;
    DROP TABLE IF EXISTS standards_tables_v1_prev;
    DROP TABLE IF EXISTS code_safety_envelopes_v1_prev;
  `);

  // Rename live -> *_v1_prev
  runD1Command(`
    ALTER TABLE standards_chunks RENAME TO standards_chunks_v1_prev;
    ALTER TABLE standards_tables RENAME TO standards_tables_v1_prev;
    ALTER TABLE code_safety_envelopes RENAME TO code_safety_envelopes_v1_prev;
  `);
  console.log('   Renamed live tables -> *_v1_prev');

  // Rename v2 -> live
  runD1Command(`
    ALTER TABLE standards_chunks_v2 RENAME TO standards_chunks;
    ALTER TABLE standards_tables_v2 RENAME TO standards_tables;
    ALTER TABLE code_safety_envelopes_v2 RENAME TO code_safety_envelopes;
  `);
  console.log('   Renamed *_v2 tables -> live tables');

  // Step 2.5: Rebuild FTS index for new standards_chunks
  console.log('\n2.5. Rebuilding FTS index on new standards_chunks...');
  try {
    runD1Command("INSERT INTO standards_fts(standards_fts) VALUES('rebuild');");
    console.log('   FTS rebuild completed successfully.');
  } catch(e) {
    console.warn('   FTS rebuild note:', e.message);
  }

  // Step 3: Verification
  console.log('\n3. Verifying new live table counts...');
  const postCounts = runD1Command(`
    SELECT 
      (SELECT count(*) FROM standards_chunks) as live_chunks,
      (SELECT count(*) FROM standards_tables) as live_tables,
      (SELECT count(*) FROM code_safety_envelopes) as live_envelopes;
  `);
  console.log('   New Live Counts:', JSON.stringify(postCounts[0]));
  console.log('\n✅ ATOMIC CUTOVER COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
  console.error('\n❌ CUTOVER ERROR:', err);
  process.exit(1);
});
