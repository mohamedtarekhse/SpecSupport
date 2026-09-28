const fs = require('fs');
const path = require('path');
const fetch = globalThis.fetch || require('node-fetch');

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';

async function ingestFile(filePath, code, title, organization) {
  console.log(`\n=== INGESTING ${code} ===`);
  const rawText = fs.readFileSync(filePath, 'utf8');
  const sections = rawText.split('\n---\n').filter(s => s.trim().length > 0);
  console.log(`Parsed ${sections.length} clauses/sections from ${path.basename(filePath)}`);

  const chunks = [];
  sections.forEach((sec, idx) => {
    const lines = sec.trim().split('\n');
    let clauseTitle = `Clause ${idx + 1}`;
    let body = sec.trim();
    
    const clauseMatch = sec.match(/(?:Clause|Section|Article)\s+[\d\.]+[^\n]*/i);
    if (clauseMatch) clauseTitle = clauseMatch[0].trim();

    chunks.push({
      section: title,
      clause: clauseTitle,
      content: `[STANDARD: ${code}] [${title}]\n${body}`
    });
  });

  console.log(`Preparing batch ingestion of ${chunks.length} chunks to ${API_BASE}/api/admin/ingest-batch...`);
  
  // Send in slices of 20
  for (let i = 0; i < chunks.length; i += 20) {
    const slice = chunks.slice(i, i + 20);
    const res = await fetch(`${API_BASE}/api/admin/ingest-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer specsupport-admin-2026'
      },
      body: JSON.stringify({
        standard_code: code,
        standard_name: title,
        organization: organization,
        scope: 'global',
        chunks: slice
      })
    });

    const data = await res.json();
    console.log(`Batch ${Math.floor(i / 20) + 1} (${slice.length} chunks):`, res.status, data.success ? '✓ SUCCESS' : `✗ ERROR: ${data.error}`);
  }
}

async function run() {
  await ingestFile(
    path.join(__dirname, '..', 'standards', 'IADC_Well_Control_Manual.txt'),
    'IADC WELL CONTROL / API 53',
    'Drilling Well Control Manual & Kill Procedures',
    'IADC / API'
  );

  await ingestFile(
    path.join(__dirname, '..', 'standards', 'OEM_BOP_Operations_and_Repair.txt'),
    'OEM BOP MANUALS',
    'OEM BOP Operations, Maintenance & Field Repair Manual',
    'Cameron / Hydril / NOV'
  );

  console.log('\nAll well control and OEM manuals successfully ingested into D1!');
}

run().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
