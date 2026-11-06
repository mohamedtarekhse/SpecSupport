const { execSync } = require('child_process');
const fs = require('fs');

function queryD1(sql) {
  const cmd = `npx.cmd wrangler d1 execute inspection-db --remote --command "${sql.replace(/"/g, '\\"')}" --json`;
  const output = execSync(cmd, { cwd: 'worker', encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']') + 1;
  return JSON.parse(output.slice(start, end))[0]?.results || [];
}

function extractKeyValues(text) {
  if (!text) return [];
  const kv = [];
  const seen = new Set();
  const numUnitRegex = /\b(\d+(?:\.\d+)?)\s*(%|HRC|HRB|HBW|HV|ksi|MPa|psi|bar|mm|in(?:ch(?:es)?)?|ft|m|°C|°F|deg|J(?:oules)?|ft-lbs?|kg|lb|ratio)\b/gi;
  let m;
  while ((m = numUnitRegex.exec(text)) !== null) {
    const val = parseFloat(m[1]);
    let unit = m[2].trim();
    if (/^in(?:ch(?:es)?)?$/i.test(unit)) unit = 'in';
    else if (/^deg$/i.test(unit)) unit = '°';
    else if (/^j(?:oules)?$/i.test(unit)) unit = 'J';
    const key = val + ':' + unit.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      kv.push([val, unit]);
    }
    if (kv.length >= 12) break;
  }
  return kv;
}

function classifyChunk(content, clause, section) {
  const text = (clause + ' ' + (section || '') + ' ' + (content || '')).trim();
  const lower = text.toLowerCase();
  
  // 1. Table row
  if (lower.startsWith('table ') || /\|.*\|.*\|/.test(content || '') || /\b(table\s+[0-9a-z\.\-_]+)/i.test(clause || '')) {
    return 'TABLE_ROW';
  }

  // 2. Definition
  if (/^(\d+\.\d+\s+)?([a-z\s\-]+:\s*(means|defined as|is defined|refers to))/i.test(content || '') ||
      /\b(is defined as|shall mean|means any|term refers to)\b/i.test(content || '') ||
      /\bdefinition\b/i.test(clause || '')) {
    return 'DEFINITION';
  }

  const hasNumUnit = /\b\d+(?:\.\d+)?\s*(%|HRC|HRB|HBW|HV|ksi|MPa|psi|bar|mm|in|ft|m|°C|°F|J|ft-lbs|kg|lb)\b/i.test(text);
  const hasComparison = /\b(not less than|not more than|shall not exceed|at least|minimum|maximum|greater than|less than|within|\bmin\b|\bmax\b|>=|<=|>|<|±)\b/i.test(lower);
  const hasRequirement = /\b(shall|should|must|not allowed|prohibited|mandatory|is required)\b/i.test(lower);

  // 3. Threshold
  if ((hasNumUnit && (hasComparison || hasRequirement)) || (hasComparison && /\d/.test(text))) {
    return 'THRESHOLD';
  }

  // 4. Requirement
  if (hasRequirement) {
    return 'REQUIREMENT';
  }

  return 'CONTEXT';
}

async function run() {
  console.log("=========================================================================");
  console.log("⚙️  BACKFILLING OBLIGATION SUBTYPING & KEY VALUES (P2.1)");
  console.log("=========================================================================\n");

  const totalRes = queryD1("SELECT count(*) as count FROM standards_chunks;");
  const total = totalRes[0]?.count || 0;
  console.log(`Total chunks in database: ${total}`);

  let offset = 0;
  const pageSize = 500;
  const overallDist = {};
  let totalProcessed = 0;

  while (offset < total) {
    const rows = queryD1(`SELECT id, clause, section, content FROM standards_chunks ORDER BY id LIMIT ${pageSize} OFFSET ${offset};`);
    if (!rows || rows.length === 0) break;

    const updates = [];
    for (const r of rows) {
      const type = classifyChunk(r.content, r.clause, r.section);
      const kv = extractKeyValues(r.content);
      const kvJson = JSON.stringify(kv);
      overallDist[type] = (overallDist[type] || 0) + 1;
      updates.push({ id: r.id, type, kvJson });
    }

    // Write batch SQL file and execute
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const subBatch = updates.slice(i, i + batchSize);
      let sqlFile = '';
      for (const item of subBatch) {
        const safeKv = item.kvJson.replace(/'/g, "''");
        sqlFile += `UPDATE standards_chunks SET obligation_type = '${item.type}', key_values = '${safeKv}' WHERE id = ${item.id};\n`;
      }
      fs.writeFileSync('worker/temp_obligation_batch.sql', sqlFile, 'utf8');
      try {
        execSync('npx.cmd wrangler d1 execute inspection-db --remote --file=temp_obligation_batch.sql', {
          cwd: 'worker',
          encoding: 'utf8'
        });
      } finally {
        if (fs.existsSync('worker/temp_obligation_batch.sql')) {
          fs.unlinkSync('worker/temp_obligation_batch.sql');
        }
      }
    }

    totalProcessed += rows.length;
    offset += pageSize;
    console.log(`Updated ${totalProcessed} / ${total} chunks...`);
  }

  console.log("\nDistribution of obligation_type across corpus:");
  for (const [k, v] of Object.entries(overallDist)) {
    const pct = ((v / total) * 100).toFixed(1);
    console.log(`  - ${k}: ${v} (${pct}%)`);
  }

  console.log("\nVerification sample from D1:");
  const sample = queryD1("SELECT id, standard_code, clause, obligation_type, key_values FROM standards_chunks WHERE key_values != '[]' LIMIT 3;");
  console.log(JSON.stringify(sample, null, 2));

  console.log("\n✨ P2.1 Backfill completed successfully!");
}

run().catch(console.error);
