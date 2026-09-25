const fs = require('fs');
const path = require('path');

const API_URL = 'https://inspection-api.mohamedtarekhse.workers.dev/api/admin/ingest'; 
const ADMIN_TOKEN = 'secret-admin-pass-2024'; 
async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let currentStandard = '';
  let currentTitle = '';
  
  // Extract Standard and Title from header
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('[STANDARD:')) {
      currentStandard = line.replace('[STANDARD:', '').replace(']', '').trim();
    } else if (line.trim().startsWith('[TITLE:')) {
      currentTitle = line.replace('[TITLE:', '').replace(']', '').trim();
    }
  }

  const chunks = [];
  
  // Split the file into chunks by the '---' delimiter
  const rawBlocks = content.split(/^-{3,}$/m);
  
  for (let block of rawBlocks) {
    block = block.trim();
    if (!block) continue;
    
    // Skip the header block if it contains [STANDARD:
    if (block.includes('[STANDARD:')) continue;
    
    // The first non-empty line of the block is the clause title
    const blockLines = block.split('\n');
    let clauseTitle = '';
    let contentBody = '';
    
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i].trim();
      if (!line) continue;
      
      if (!clauseTitle) {
        clauseTitle = line.replace(/^\[?CLAUSE:\s*/i, '').replace(/\]$/, '').trim();
        // If the first line doesn't look like a title but just text, use a generic title
        if (clauseTitle.length > 100) {
           clauseTitle = "General Clause";
           contentBody += line + '\n';
        }
      } else {
        contentBody += blockLines[i] + '\n';
      }
    }
    
    contentBody = contentBody.trim();
    
    if (clauseTitle && contentBody) {
      chunks.push({
        standard_code: currentStandard || 'UNKNOWN',
        standard_name: currentTitle || 'UNKNOWN',
        section: 'General',
        clause: clauseTitle,
        content: contentBody
      });
    }
  }

  return chunks;
}

async function ingestChunks(chunks) {
  console.log(`Starting ingestion of ${chunks.length} chunks...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`\rProgress: ${i + 1}/${chunks.length} chunks`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chunk)
      });
      
      if (!response.ok) {
         console.error(`\nFailed to ingest chunk ${chunk.clause}: ${response.statusText}`);
         const txt = await response.text();
         console.error(txt);
      }
    } catch (e) {
      console.error(`\nError sending chunk ${chunk.clause}:`, e);
    }
  }
  console.log('\nIngestion complete.');
}

async function main() {
  const standardsDir = path.join(__dirname, '../standards');
  if (!fs.existsSync(standardsDir)) {
    console.error(`Directory ${standardsDir} does not exist. Please create it and add .txt files.`);
    return;
  }
  
  const onlyFile = process.argv[2];
  const files = fs.readdirSync(standardsDir).filter(f => f.endsWith('.txt') && (!onlyFile || f === onlyFile));
  if (files.length === 0) {
    console.log('No .txt files found in standards directory.');
    return;
  }
  
  let allChunks = [];
  for (const file of files) {
    console.log(`Processing file: ${file}${onlyFile ? ' (requested)' : ''}`);
    const filePath = path.join(standardsDir, file);
    const chunks = await processFile(filePath);
    allChunks = allChunks.concat(chunks);
  }
  
  await ingestChunks(allChunks);
}

main().catch(console.error);
