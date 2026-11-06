const { execSync } = require('child_process');
const fs = require('fs');

function queryD1(sql) {
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${sql.replace(/"/g, '\\"')}" --json`;
  const output = execSync(cmd, { cwd: 'worker', encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']') + 1;
  return JSON.parse(output.slice(start, end))[0]?.results || [];
}

const STANDARD_BASELINE_SECTIONS = {
  'ASME IX': 12,
  'ASME VIII Div 1': 18,
  'ASME B31.3': 15,
  'ASME B31.4': 12,
  'ASME B31.8': 12,
  'ASME B31.1': 12,
  'ASME V': 10,
  'API 1104': 14,
  'API 570': 11,
  'API 510': 10,
  'API 653': 12,
  'API 571': 15,
  'API 579': 14,
  'API 5CT': 10,
  'API 6A': 12,
  'API 16A': 10,
  'API 16D': 8,
  'API RP 53': 10,
  'API RP 2X': 8,
  'API RP 5C1': 8,
  'API RP 7G-2': 8,
  'AWS D1.1': 10,
  'AWS B1.11': 8,
  'ISO 3834-2': 6,
  'NACE MR0175': 8,
  'IADC': 12,
  'DS-1': 10
};

async function run() {
  console.log("=========================================================================");
  console.log("📊 RUNNING CORPUS COVERAGE PARITY AUDIT (P2.4)");
  console.log("=========================================================================\n");

  // Ensure table exists
  console.log("Ensuring standards_coverage table exists in D1...");
  const createSql = `CREATE TABLE IF NOT EXISTS standards_coverage (
    standard_code TEXT PRIMARY KEY,
    sections_total INTEGER,
    sections_ingested INTEGER,
    coverage_pct REAL,
    last_audit DATETIME DEFAULT CURRENT_TIMESTAMP
  );`;
  fs.writeFileSync('worker/temp_create_cov.sql', createSql, 'utf8');
  try {
    execSync(`npx.cmd wrangler d1 execute inspection-db --remote --file=temp_create_cov.sql`, {
      cwd: 'worker',
      encoding: 'utf8'
    });
  } finally {
    if (fs.existsSync('worker/temp_create_cov.sql')) fs.unlinkSync('worker/temp_create_cov.sql');
  }

  // Query section distribution per standard in standards_chunks
  const stats = queryD1("SELECT standard_code, COUNT(DISTINCT section) as sections_ingested, COUNT(id) as chunk_count FROM standards_chunks GROUP BY standard_code ORDER BY chunk_count DESC;");

  console.log(`Found ${stats.length} distinct standards loaded in corpus.\n`);

  const records = [];
  for (const s of stats) {
    const code = s.standard_code;
    const ingested = Number(s.sections_ingested) || 1;
    const baseline = STANDARD_BASELINE_SECTIONS[code] || Math.max(ingested, 10);
    const pct = Math.min(100.0, Number(((ingested / baseline) * 100).toFixed(1)));

    records.push({
      standard_code: code,
      sections_total: baseline,
      sections_ingested: ingested,
      coverage_pct: pct,
      chunk_count: s.chunk_count
    });
  }

  // Batch insert into standards_coverage
  let sqlBatch = '';
  for (const r of records) {
    const safeCode = r.standard_code.replace(/'/g, "''");
    sqlBatch += `INSERT INTO standards_coverage (standard_code, sections_total, sections_ingested, coverage_pct, last_audit)
      VALUES ('${safeCode}', ${r.sections_total}, ${r.sections_ingested}, ${r.coverage_pct}, CURRENT_TIMESTAMP)
      ON CONFLICT(standard_code) DO UPDATE SET
        sections_total = excluded.sections_total,
        sections_ingested = excluded.sections_ingested,
        coverage_pct = excluded.coverage_pct,
        last_audit = CURRENT_TIMESTAMP;\n`;
  }

  fs.writeFileSync('worker/temp_coverage_batch.sql', sqlBatch, 'utf8');
  try {
    execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_coverage_batch.sql', {
      cwd: 'worker',
      encoding: 'utf8'
    });
  } finally {
    if (fs.existsSync('worker/temp_coverage_batch.sql')) {
      fs.unlinkSync('worker/temp_coverage_batch.sql');
    }
  }

  console.log("Coverage Audit Results:");
  console.log("-------------------------------------------------------------------------");
  console.log("Standard Code            | Ingested / Total Sec | Coverage % | Total Chunks");
  console.log("-------------------------------------------------------------------------");
  let lowCoverageCount = 0;
  for (const r of records) {
    const codeCol = r.standard_code.padEnd(24);
    const secCol = `${r.sections_ingested} / ${r.sections_total}`.padEnd(20);
    const pctCol = `${r.coverage_pct}%`.padEnd(12);
    const warn = r.coverage_pct < 90 ? "⚠️ <90%" : "✓ OK";
    if (r.coverage_pct < 90) lowCoverageCount++;
    console.log(`${codeCol} | ${secCol} | ${pctCol} | ${r.chunk_count} ${warn}`);
  }
  console.log("-------------------------------------------------------------------------");
  console.log(`Audit complete: ${records.length} standards audited, ${lowCoverageCount} flagged <90% (warn only).`);
}

run().catch(console.error);
