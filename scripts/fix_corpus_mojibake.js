const { execSync } = require('child_process');
const fs = require('fs');

function queryD1(sql) {
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${sql.replace(/"/g, '\\"')}" --json`;
  const output = execSync(cmd, { cwd: 'worker', encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']') + 1;
  return JSON.parse(output.slice(start, end))[0]?.results || [];
}

function cleanMojibake(text) {
  if (!text || typeof text !== 'string') return text;
  let cleaned = text;

  // 1. Mangled multi-byte UTF-8 representations
  cleaned = cleaned
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/â€œ/g, '"')
    .replace(/â€\x9d/g, '"')
    .replace(/â€˜/g, "'")
    .replace(/â€™/g, "'")
    .replace(/Ã¢â‚¬â€/g, '—')
    .replace(/Â°/g, '°')
    .replace(/Â±/g, '±')
    .replace(/Âµ/g, 'µ')
    .replace(/Â/g, '');

  // 2. Replacement characters \uFFFD ()
  // Between numbers or ranges (e.g. 1020 or 100150) -> '-'
  cleaned = cleaned.replace(/(\d+)\s*\uFFFD+\s*(\d+)/g, '$1-$2');
  // Between words or clauses (e.g. QW-422  P-Number) -> ' — '
  cleaned = cleaned.replace(/([a-zA-Z0-9\.\-_]+)\s*\uFFFD+\s*([a-zA-Z0-9\.\-_]+)/g, '$1 — $2');
  // Standalone replacement characters -> '—' or '-'
  cleaned = cleaned.replace(/\uFFFD+/g, '—');

  // 3. Isolated Question mark mojibake between words (e.g. "QW-422 ? P-Number")
  cleaned = cleaned.replace(/([A-Z0-9\-_]{2,})\s+\?\s+([A-Z])/g, '$1 — $2');
  cleaned = cleaned.replace(/(\d+)\s+\?\s+(\d+)/g, '$1-$2');

  return cleaned;
}

async function run() {
  console.log("=========================================================================");
  console.log("🧹 EXECUTING CORPUS MOJIBAKE & MANGLED EN/EM DASH REPAIR (ITEM 0)");
  console.log("=========================================================================\n");

  const totalRes = queryD1("SELECT count(*) as count FROM standards_chunks;");
  const total = totalRes[0]?.count || 0;
  console.log(`Total database chunks: ${total}`);

  let offset = 0;
  const pageSize = 500;
  let affectedChunks = 0;
  const updates = [];

  while (offset < total) {
    const rows = queryD1(`SELECT id, clause, section, content FROM standards_chunks ORDER BY id LIMIT ${pageSize} OFFSET ${offset};`);
    if (!rows || rows.length === 0) break;

    for (const r of rows) {
      const origContent = r.content || '';
      const origClause = r.clause || '';
      const origSection = r.section || '';

      const newContent = cleanMojibake(origContent);
      const newClause = cleanMojibake(origClause);
      const newSection = cleanMojibake(origSection);

      if (newContent !== origContent || newClause !== origClause || newSection !== origSection) {
        affectedChunks++;
        updates.push({
          id: r.id,
          clause: newClause,
          section: newSection,
          content: newContent
        });
      }
    }

    offset += pageSize;
    process.stdout.write(`Analyzed ${Math.min(offset, total)} / ${total} chunks...\r`);
  }

  console.log(`\n\nIdentified ${affectedChunks} chunks requiring mojibake repair.`);

  if (updates.length > 0) {
    console.log(`Applying updates in batches of 500 rows...`);
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      let sqlFile = '';
      for (const item of batch) {
        const safeContent = item.content.replace(/'/g, "''");
        const safeClause = item.clause.replace(/'/g, "''");
        const safeSection = item.section.replace(/'/g, "''");
        sqlFile += `UPDATE standards_chunks SET content = '${safeContent}', clause = '${safeClause}', section = '${safeSection}' WHERE id = ${item.id};\n`;
      }

      fs.writeFileSync('worker/temp_mojibake_batch.sql', sqlFile, 'utf8');
      try {
        execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_mojibake_batch.sql', {
          cwd: 'worker',
          encoding: 'utf8'
        });
        console.log(`Applied batch ${Math.floor(i / batchSize) + 1} (${batch.length} rows updated)`);
      } finally {
        if (fs.existsSync('worker/temp_mojibake_batch.sql')) {
          fs.unlinkSync('worker/temp_mojibake_batch.sql');
        }
      }
    }
  }

  // Verification pass
  console.log("\nRunning post-repair verification check...");
  const postCheck = queryD1("SELECT count(*) as count FROM standards_chunks WHERE content LIKE '%\uFFFD%' OR clause LIKE '%\uFFFD%';");
  console.log(`Remaining chunks with \\uFFFD after repair: ${postCheck[0]?.count || 0}`);
  console.log("✨ Mojibake repair pass complete!");
}

run().catch(console.error);
