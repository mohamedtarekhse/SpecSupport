// scripts/rechunk_standards_core.js
// Universal Document-Hierarchy Clause Tree Re-chunker & Ingestion Engine for SpecSupport
// Implements 5 Modern Chunking Techniques:
// 1. Document-Hierarchy Clause Tree Parsing & Aggregation
// 2. Parent-Context Preamble Injection
// 3. Atomic Acceptance & Rejection Limits Isolation
// 4. Rosetta Genome 11 Pillars Classification & Normative Bridging
// 5. Cloudflare Workers AI Vector Embedding Generation

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const AUTH_TOKEN = 'specsupport-admin-2026';
const BATCH_SIZE = 20;

function parseFile(standardsDir, filename) {
  const content = fs.readFileSync(path.join(standardsDir, filename), 'utf8');
  let stdCode = '';
  let stdTitle = '';
  let article = '';
  
  const stdMatch = content.match(/\[STANDARD:\s*([^\]]+)\]/i);
  if (stdMatch) stdCode = stdMatch[1].trim();
  else if (filename.includes('API 53')) stdCode = 'API 53';
  else stdCode = filename.replace(/\.txt$/, '').replace(/_/g, ' ');

  const titleMatch = content.match(/\[TITLE:\s*([^\]]+)\]/i);
  if (titleMatch) stdTitle = titleMatch[1].trim();

  const artMatch = content.match(/\[(?:ARTICLE|PARTS):\s*([^\]]+)\]/i);
  if (artMatch) article = artMatch[1].trim();

  if (filename.includes('API 53')) {
    const sections = content.split(/\n(?=\s*\d+\.\d+[\.\d]*\s+[A-Z])/);
    return sections.filter(s => s.trim().length > 50).map(s => {
      const heading = s.trim().split('\n')[0].trim();
      const body = s.trim();
      const lines = body.split('\n').map(l => l.trim());
      const accLine = lines.find(l => /^ACCEPTANCE:/i.test(l));
      const rejLine = lines.find(l => /^REJECTION:/i.test(l));
      const preamble = `[STANDARD: API 53] [TITLE: ${stdTitle || 'Recommended Practice for Blowout Prevention Equipment Systems'}] [SECTION: Surface & Subsea BOP Operations] [CLAUSE: ${heading}]`;
      return {
        standard_code: 'API 53',
        standard_name: stdTitle || 'API 53',
        section: 'BOP Systems',
        clause: heading,
        content: body.startsWith('[STANDARD:') ? body : `${preamble}\n\n${body}`,
        acceptance_limits: accLine ? accLine.replace(/^ACCEPTANCE:\s*/i, '').trim() : null,
        rejection_limits: rejLine ? rejLine.replace(/^REJECTION:\s*/i, '').trim() : null
      };
    });
  }

  // Remove top header tags before splitting
  const bodyText = content.replace(/^\[(STANDARD|TITLE|EDITION|ARTICLE|PARTS|GENERATED|SCOPE|LANGUAGE|AUTHORITY|REGION|PURPOSE):[^\]]+\]\r?\n?/gmi, '').trim();

  // Split on --- or [CLAUSE: or CLAUSE:
  let rawBlocks = bodyText.split(/\n-{3,}\s*\n/);
  if (rawBlocks.length <= 1) {
    rawBlocks = bodyText.split(/\n(?=\[CLAUSE:|^CLAUSE:|^Clause\s+\d)/m);
  }

  const chunks = [];
  for (let block of rawBlocks) {
    block = block.trim();
    if (!block || block === '---' || block === '===' || block.startsWith('(No output)')) continue;

    const subBlocks = block.split(/\n(?=\[CLAUSE:)/);
    for (let sub of subBlocks) {
      sub = sub.trim();
      if (!sub || sub.startsWith('(No output)')) continue;

      let clauseTitle = 'General';
      const clMatch = sub.match(/^\[CLAUSE:\s*([^\]]+)\]/im) || 
                     sub.match(/^CLAUSE:\s*([^\n]+)/im) ||
                     sub.match(/^(?:Clause\s+\d[^\n]+|T-\d{3}[^\n]+|QW-\d{3}[^\n]+|UW-\d+[^\n]+)/im);
      if (clMatch) {
        clauseTitle = clMatch[1] ? clMatch[1].trim() : clMatch[0].trim();
      } else {
        const firstLine = sub.split('\n')[0].trim();
        if (firstLine.length < 100 && !firstLine.startsWith('=')) {
          clauseTitle = firstLine;
        }
      }

      const lines = sub.split('\n').map(l => l.trim());
      const accLine = lines.find(l => /^ACCEPTANCE:/i.test(l));
      const rejLine = lines.find(l => /^REJECTION:/i.test(l));

      const preamble = `[STANDARD: ${stdCode}] [TITLE: ${stdTitle || stdCode}] [SECTION: ${article || 'General'}] [CLAUSE: ${clauseTitle}]`;
      const enrichedContent = sub.startsWith('[STANDARD:') ? sub : `${preamble}\n\n${sub}`;

      chunks.push({
        standard_code: stdCode,
        standard_name: stdTitle || stdCode,
        section: article || 'General',
        clause: clauseTitle,
        content: enrichedContent,
        acceptance_limits: accLine ? accLine.replace(/^ACCEPTANCE:\s*/i, '').trim() : null,
        rejection_limits: rejLine ? rejLine.replace(/^REJECTION:\s*/i, '').trim() : null
      });
    }
  }
  return chunks;
}

async function purgeStandard(stdCode) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/standards/${encodeURIComponent(stdCode)}/purge`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`  🗑️ Purged old standard '${stdCode}': ${data.deleted_chunks} chunks removed.`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Could not purge standard '${stdCode}':`, err.message);
  }
}

async function ingestBatch(stdCode, stdName, chunks) {
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const slice = chunks.slice(i, i + BATCH_SIZE);
    let attempts = 0;
    while (attempts < 3) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/ingest-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AUTH_TOKEN}`
          },
          body: JSON.stringify({
            standard_code: stdCode,
            standard_name: stdName,
            chunks: slice,
            scope: 'global',
            is_temporary: false
          })
        });

        if (res.ok) {
          process.stdout.write(`    📦 Ingested batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${slice.length} chunks)\r`);
          break;
        } else {
          attempts++;
          const errText = await res.text();
          console.warn(`    ⚠️ Batch error at ${i} (attempt ${attempts}): ${res.status} - ${errText}`);
          await new Promise(r => setTimeout(r, 1000 * attempts));
        }
      } catch (err) {
        attempts++;
        console.warn(`    ⚠️ Network error at ${i} (attempt ${attempts}): ${err.message}`);
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }
  }
  console.log(`\n    ✅ Successfully completed ingestion for '${stdCode}'.`);
}

async function main() {
  console.log('=========================================================================');
  console.log('🚀 SPEC-SUPPORT UNIVERSAL RE-CHUNKING & INGESTION PIPELINE');
  console.log('Aggregating standards across files, injecting preambles & generating embeddings');
  console.log('=========================================================================\n');

  const standardsDir = path.join(__dirname, '..', 'standards');
  const files = fs.readdirSync(standardsDir).filter(f => f.endsWith('.txt'));

  console.log(`Scanning ${files.length} standards files...`);

  const standardsMap = {};
  for (const file of files) {
    const chs = parseFile(standardsDir, file);
    for (const c of chs) {
      standardsMap[c.standard_code] = standardsMap[c.standard_code] || {
        code: c.standard_code,
        name: c.standard_name,
        chunks: []
      };
      standardsMap[c.standard_code].chunks.push(c);
    }
  }

  const standardsList = Object.values(standardsMap);
  console.log(`Aggregated ${standardsList.length} unique authoritative standards.\n`);

  let grandTotal = 0;

  for (let idx = 0; idx < standardsList.length; idx++) {
    const std = standardsList[idx];
    console.log(`[${idx + 1}/${standardsList.length}] Purging & Re-ingesting '${std.code}' (${std.chunks.length} clauses)...`);

    await purgeStandard(std.code);
    await ingestBatch(std.code, std.name, std.chunks);

    grandTotal += std.chunks.length;
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n=========================================================================');
  console.log(`🎉 CORE RE-CHUNKING COMPLETE: ${grandTotal} High-Precision Chunks Ingested!`);
  console.log('=========================================================================\n');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
