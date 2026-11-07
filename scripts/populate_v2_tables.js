// scripts/populate_v2_tables.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function runD1File(sqlStatements) {
  const tempFile = path.join(__dirname, 'temp_pop.sql');
  fs.writeFileSync(tempFile, sqlStatements, 'utf8');
  try {
    const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --file "${tempFile}" --json`;
    execSync(cmd, { encoding: 'utf8', cwd: path.resolve(__dirname, '..'), maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

async function main() {
  const normFile = path.resolve(__dirname, '..', '.backups', 'corpus_v2_normalized.json');
  if (!fs.existsSync(normFile)) throw new Error('Missing ' + normFile);
  const data = JSON.parse(fs.readFileSync(normFile, 'utf8'));

  console.log('1. Clearing v2 tables before load...');
  runD1File(`
    DELETE FROM standards_chunks_v2;
    DELETE FROM standards_tables_v2;
    DELETE FROM code_safety_envelopes_v2;
    DELETE FROM chunks_review_v2;
  `);

  console.log(`2. Loading ${data.envelopes.length} code_safety_envelopes_v2...`);
  const envSql = data.envelopes.map(e => `
    INSERT INTO code_safety_envelopes_v2 (
      material_group, min_preheat_c, min_preheat_f, max_interpass_c, max_interpass_f,
      pwht_thickness_threshold_mm, pwht_min_temp_c, pwht_max_temp_c, max_hardness_hrc,
      governing_standard, is_active, primary_code, source_chunk_id, min_remaining_wall_pct,
      min_hydrotest_ratio, notes
    ) VALUES (
      ${escapeSql(e.material_group)}, ${e.min_preheat_c ?? 'NULL'}, ${e.min_preheat_f ?? 'NULL'},
      ${e.max_interpass_c ?? 'NULL'}, ${e.max_interpass_f ?? 'NULL'},
      ${e.pwht_thickness_threshold_mm ?? 'NULL'}, ${e.pwht_min_temp_c ?? 'NULL'},
      ${e.pwht_max_temp_c ?? 'NULL'}, ${e.max_hardness_hrc ?? 'NULL'},
      ${escapeSql(e.governing_standard)}, ${e.is_active ?? 1},
      ${escapeSql(e.primary_code)}, ${e.source_chunk_id ?? 'NULL'},
      ${e.min_remaining_wall_pct ?? 'NULL'}, ${e.min_hydrotest_ratio ?? 'NULL'},
      ${escapeSql(e.notes)}
    );
  `).join('\n');
  runD1File(envSql);
  console.log('   Envelopes loaded.');

  console.log(`3. Loading ${data.tables.length} standards_tables_v2...`);
  const tblBatchSize = 40;
  for (let i = 0; i < data.tables.length; i += tblBatchSize) {
    const slice = data.tables.slice(i, i + tblBatchSize);
    const sql = slice.map(t => `
      INSERT INTO standards_tables_v2 (
        standard_code, edition, table_id, table_title, section_context,
        headers_json, raw_markdown, structured_json, scope, session_id, file_hash
      ) VALUES (
        ${escapeSql(t.standard_code)}, ${escapeSql(t.edition)}, ${escapeSql(t.table_id)},
        ${escapeSql(t.table_title)}, ${escapeSql(t.section_context)},
        ${escapeSql(t.headers_json)}, ${escapeSql(t.raw_markdown)},
        ${escapeSql(t.structured_json)}, ${escapeSql(t.scope || 'global')},
        ${escapeSql(t.session_id)}, ${escapeSql(t.file_hash)}
      );
    `).join('\n');
    runD1File(sql);
    process.stdout.write(`   Loaded tables ${Math.min(i + tblBatchSize, data.tables.length)}/${data.tables.length}\r`);
  }
  console.log('\n   Tables loaded.');

  console.log(`4. Loading ${data.quarantine.length} quarantined chunks into chunks_review_v2...`);
  if (data.quarantine.length > 0) {
    const qSql = data.quarantine.map((q, idx) => `
      INSERT INTO chunks_review_v2 (
        id, standard_code, standard_name, section, clause, content,
        scope, organization, pillar_type, obligation_type, key_values,
        is_excluded, reject_reason
      ) VALUES (
        ${escapeSql('q_v2_' + idx)}, ${escapeSql(q.standard_code)}, ${escapeSql(q.standard_name)},
        ${escapeSql(q.section)}, ${escapeSql(q.clause)}, ${escapeSql(q.content)},
        ${escapeSql(q.scope || 'global')}, ${escapeSql(q.organization || 'INTERNATIONAL')},
        ${escapeSql(q.pillar_type || 'GENERAL')}, ${escapeSql(q.obligation_type || 'CONTEXT')},
        ${escapeSql(q.key_values || '[]')}, ${q.is_excluded ?? 0}, ${escapeSql(q.reject_reason)}
      );
    `).join('\n');
    runD1File(qSql);
    console.log('   Quarantine loaded.');
  }

  console.log(`5. Loading ${data.chunks.length} valid chunks into standards_chunks_v2...`);
  const chunkBatchSize = 40;
  for (let i = 0; i < data.chunks.length; i += chunkBatchSize) {
    const slice = data.chunks.slice(i, i + chunkBatchSize);
    const sql = slice.map(c => `
      INSERT INTO standards_chunks_v2 (
        standard_code, standard_name, section, clause, content,
        scope, organization, pillar_type, obligation_type, key_values,
        is_excluded, edition
      ) VALUES (
        ${escapeSql(c.standard_code)}, ${escapeSql(c.standard_name)},
        ${escapeSql(c.section)}, ${escapeSql(c.clause)}, ${escapeSql(c.content)},
        ${escapeSql(c.scope || 'global')}, ${escapeSql(c.organization || 'INTERNATIONAL')},
        ${escapeSql(c.pillar_type || 'GENERAL')}, ${escapeSql(c.obligation_type || 'CONTEXT')},
        ${escapeSql(c.key_values || '[]')}, ${c.is_excluded ?? 0}, ${escapeSql(c.edition)}
      );
    `).join('\n');
    runD1File(sql);
    process.stdout.write(`   Loaded chunks ${Math.min(i + chunkBatchSize, data.chunks.length)}/${data.chunks.length}\r`);
  }
  console.log('\n   Chunks loaded successfully.');

  console.log('\n6. Verifying D1 row counts in v2 staging tables:');
  const checkSql = `
    SELECT 'chunks_v2' as tbl, count(*) as count FROM standards_chunks_v2
    UNION ALL
    SELECT 'tables_v2' as tbl, count(*) as count FROM standards_tables_v2
    UNION ALL
    SELECT 'envelopes_v2' as tbl, count(*) as count FROM code_safety_envelopes_v2
    UNION ALL
    SELECT 'quarantine_v2' as tbl, count(*) as count FROM chunks_review_v2;
  `;
  const countsOut = execSync(`npx.cmd wrangler d1 execute inspection-db --remote --json --command "${checkSql.replace(/"/g, '')}"`, {
    encoding: 'utf8', cwd: path.resolve(__dirname, '..')
  });
  const jsonStart = countsOut.indexOf('[');
  const rows = JSON.parse(countsOut.slice(jsonStart))[0]?.results || [];
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
