// scripts/export_corpus_v1.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function queryD1(sql) {
  const cleanSql = sql.replace(/"/g, "'");
  const cmdline = `npx.cmd wrangler d1 execute inspection-db --remote --json --command "${cleanSql}"`;
  const out = execSync(cmdline, {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
    maxBuffer: 64 * 1024 * 1024,
    timeout: 120000,
    stdio: ['ignore', 'pipe', 'ignore']
  });
  const jsonStart = out.indexOf('[');
  if (jsonStart === -1) throw new Error('No JSON output: ' + out);
  const json = JSON.parse(out.slice(jsonStart));
  return json[0]?.results || [];
}

async function main() {
  const dateStr = '2026-11-07';
  const backupDir = path.resolve(__dirname, '..', '.backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const snapshotPath = path.join(backupDir, `corpus_v1_${dateStr}.json`);

  console.log('Querying table counts...');
  const chunkCount = queryD1('SELECT count(*) as cnt FROM standards_chunks')[0].cnt;
  const tableCount = queryD1('SELECT count(*) as cnt FROM standards_tables')[0].cnt;
  const envelopeCount = queryD1('SELECT count(*) as cnt FROM code_safety_envelopes')[0].cnt;
  console.log(`Live v1 counts: chunks=${chunkCount}, tables=${tableCount}, envelopes=${envelopeCount}`);

  console.log('Fetching standards_tables...');
  const tables = queryD1('SELECT * FROM standards_tables ORDER BY id ASC');
  console.log(`Fetched ${tables.length} tables.`);

  console.log('Fetching code_safety_envelopes...');
  const envelopes = queryD1('SELECT * FROM code_safety_envelopes ORDER BY id ASC');
  console.log(`Fetched ${envelopes.length} envelopes.`);

  console.log(`Fetching ${chunkCount} chunks in batches of 500...`);
  const chunks = [];
  const batchSize = 500;
  for (let offset = 0; offset < chunkCount; offset += batchSize) {
    process.stdout.write(`Fetching offset ${offset}... `);
    const rows = queryD1(`SELECT * FROM standards_chunks ORDER BY id ASC LIMIT ${batchSize} OFFSET ${offset}`);
    chunks.push(...rows);
    console.log(`done (${chunks.length}/${chunkCount})`);
  }

  const snapshot = {
    exported_at: new Date().toISOString(),
    counts: {
      standards_chunks: chunks.length,
      standards_tables: tables.length,
      code_safety_envelopes: envelopes.length
    },
    standards_chunks: chunks,
    standards_tables: tables,
    code_safety_envelopes: envelopes
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  const sizeMB = (fs.statSync(snapshotPath).size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Snapshot saved to ${snapshotPath} (${sizeMB} MB)`);
  console.log(`Snapshot counts: chunks=${chunks.length}, tables=${tables.length}, envelopes=${envelopes.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
