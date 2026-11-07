const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runD1(sql) {
  const tempFile = path.join(__dirname, 'temp_query.sql');
  fs.writeFileSync(tempFile, sql, 'utf8');
  try {
    const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --file "${tempFile}" --json`;
    const out = execSync(cmd, { encoding: 'utf8', cwd: path.resolve(__dirname, '..'), maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
    const jsonStart = out.indexOf('[');
    if (jsonStart === -1) {
      console.warn('No JSON array found in output:', out);
      return [];
    }
    const parsed = JSON.parse(out.slice(jsonStart));
    return parsed[0]?.results || [];
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

async function main() {
  console.log('1. Verifying row counts on live v1 tables...');
  const countChunks = runD1('SELECT count(*) as count FROM standards_chunks')[0].count;
  const countTables = runD1('SELECT count(*) as count FROM standards_tables')[0].count;
  const countEnvelopes = runD1('SELECT count(*) as count FROM code_safety_envelopes')[0].count;
  console.log(`Live v1 counts: chunks=${countChunks}, tables=${countTables}, envelopes=${countEnvelopes}`);

  console.log('2. Creating D1-side copy tables (*_v1_backup)...');
  runD1(`
    DROP TABLE IF EXISTS standards_chunks_v1_backup;
    CREATE TABLE standards_chunks_v1_backup AS SELECT * FROM standards_chunks;

    DROP TABLE IF EXISTS standards_tables_v1_backup;
    CREATE TABLE standards_tables_v1_backup AS SELECT * FROM standards_tables;

    DROP TABLE IF EXISTS code_safety_envelopes_v1_backup;
    CREATE TABLE code_safety_envelopes_v1_backup AS SELECT * FROM code_safety_envelopes;
  `);

  const backupChunks = runD1('SELECT count(*) as count FROM standards_chunks_v1_backup')[0].count;
  const backupTables = runD1('SELECT count(*) as count FROM standards_tables_v1_backup')[0].count;
  const backupEnvelopes = runD1('SELECT count(*) as count FROM code_safety_envelopes_v1_backup')[0].count;
  console.log(`D1-side backup counts: chunks_v1_backup=${backupChunks}, tables_v1_backup=${backupTables}, envelopes_v1_backup=${backupEnvelopes}`);

  console.log('3. Creating staging tables (*_v2)...');
  runD1(`
    DROP TABLE IF EXISTS standards_chunks_v2;
    CREATE TABLE standards_chunks_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      standard_code TEXT NOT NULL,
      standard_name TEXT NOT NULL,
      section TEXT NOT NULL,
      clause TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      scope TEXT DEFAULT 'global',
      organization TEXT DEFAULT 'INTERNATIONAL',
      session_id TEXT,
      expires_at DATETIME,
      is_excluded INTEGER DEFAULT 0,
      pillar_type TEXT DEFAULT 'GENERAL',
      in_scope TEXT,
      out_of_scope TEXT,
      acceptance_limits TEXT,
      rejection_limits TEXT,
      normative_refs TEXT,
      qa_docs TEXT,
      edition TEXT DEFAULT NULL,
      obligation_type TEXT,
      key_values TEXT
    );

    DROP TABLE IF EXISTS standards_tables_v2;
    CREATE TABLE standards_tables_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      standard_code TEXT NOT NULL,
      edition TEXT,
      table_id TEXT NOT NULL,
      table_title TEXT NOT NULL,
      section_context TEXT,
      headers_json TEXT NOT NULL,
      raw_markdown TEXT NOT NULL,
      structured_json TEXT NOT NULL,
      scope TEXT DEFAULT 'global',
      session_id TEXT,
      file_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    DROP TABLE IF EXISTS code_safety_envelopes_v2;
    CREATE TABLE code_safety_envelopes_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_group TEXT NOT NULL,
      min_preheat_c REAL,
      min_preheat_f REAL,
      max_interpass_c REAL,
      max_interpass_f REAL,
      pwht_thickness_threshold_mm REAL,
      pwht_min_temp_c REAL,
      pwht_max_temp_c REAL,
      max_hardness_hrc REAL,
      governing_standard TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      primary_code TEXT,
      source_chunk_id INTEGER,
      min_remaining_wall_pct REAL,
      min_hydrotest_ratio REAL,
      notes TEXT
    );

    DROP TABLE IF EXISTS chunks_review_v2;
    CREATE TABLE chunks_review_v2 (
      id TEXT PRIMARY KEY,
      standard_code TEXT,
      standard_name TEXT,
      section TEXT,
      clause TEXT,
      content TEXT,
      embedding TEXT,
      scope TEXT,
      organization TEXT,
      session_id TEXT,
      expires_at TEXT,
      obligation_type TEXT,
      key_values TEXT,
      pillar_type TEXT,
      is_excluded INTEGER DEFAULT 0,
      in_scope TEXT,
      out_of_scope TEXT,
      acceptance_limits TEXT,
      rejection_limits TEXT,
      normative_refs TEXT,
      qa_docs TEXT,
      reject_reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Staging tables created successfully.');

  console.log('4. Exporting full snapshot to .backups/corpus_v1_2026-11-07.json...');
  const dateStr = '2026-11-07';
  const backupDir = path.resolve(__dirname, '..', '.backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const snapshotPath = path.join(backupDir, `corpus_v1_${dateStr}.json`);

  // Fetch all tables
  const tablesData = runD1('SELECT * FROM standards_tables');
  const envelopesData = runD1('SELECT * FROM code_safety_envelopes');

  // Fetch chunks in batches to avoid maxBuffer / query size limits
  console.log('Fetching chunks in batches of 500...');
  const chunksData = [];
  const batchSize = 500;
  for (let offset = 0; offset < countChunks; offset += batchSize) {
    process.stdout.write(`Fetching chunks ${offset} to ${Math.min(offset + batchSize, countChunks)}... `);
    const batch = runD1(`SELECT * FROM standards_chunks ORDER BY id ASC LIMIT ${batchSize} OFFSET ${offset}`);
    chunksData.push(...batch);
    console.log(`done (${chunksData.length}/${countChunks})`);
  }

  const snapshot = {
    exported_at: new Date().toISOString(),
    counts: {
      standards_chunks: chunksData.length,
      standards_tables: tablesData.length,
      code_safety_envelopes: envelopesData.length
    },
    standards_chunks: chunksData,
    standards_tables: tablesData,
    code_safety_envelopes: envelopesData
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  const sizeMB = (fs.statSync(snapshotPath).size / (1024 * 1024)).toFixed(2);
  console.log(`Export complete: ${snapshotPath} (${sizeMB} MB)`);
  console.log(`Summary: chunks=${chunksData.length}, tables=${tablesData.length}, envelopes=${envelopesData.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
