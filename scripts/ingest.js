const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8787/api/admin/ingest'; // Change to production URL when needed
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_SECRET_ADMIN_TOKEN'; // Set via env or edit here

async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  let currentStandard = '';
  let currentTitle = '';
  
  const chunks = [];
  
  // A naive parser based on the requested format
  // [STANDARD: API 6A]
  // [TITLE: Specification for ...]
  // [CLAUSE: 5.1.1]
  // Content...
  // ---
  
  const lines = content.split('\n');
  let currentClause = '';
  let currentContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('[STANDARD:')) {
      currentStandard = line.replace('[STANDARD:', '').replace(']', '').trim();
    } else if (line.startsWith('[TITLE:')) {
      currentTitle = line.replace('[TITLE:', '').replace(']', '').trim();
    } else if (line.startsWith('[CLAUSE:')) {
      if (currentClause && currentContent) {
        chunks.push({
          standard_code: currentStandard,
          standard_name: currentTitle,
          section: 'General',
          clause: currentClause,
          content: currentContent.trim()
        });
      }
      currentClause = line.replace('[CLAUSE:', '').replace(']', '').trim();
      currentContent = '';
    } else if (line === '---') {
      if (currentClause && currentContent) {
        chunks.push({
          standard_code: currentStandard,
          standard_name: currentTitle,
          section: 'General',
          clause: currentClause,
          content: currentContent.trim()
        });
        currentClause = '';
        currentContent = '';
      }
    } else {
      if (currentClause) {
        currentContent += line + '\n';
      }
    }
  }
  
  if (currentClause && currentContent) {
     chunks.push({
      standard_code: currentStandard,
      standard_name: currentTitle,
      section: 'General',
      clause: currentClause,
      content: currentContent.trim()
    });
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
  
  const files = fs.readdirSync(standardsDir).filter(f => f.endsWith('.txt'));
  if (files.length === 0) {
    console.log('No .txt files found in standards directory.');
    return;
  }
  
  let allChunks = [];
  for (const file of files) {
    console.log(`Processing file: ${file}`);
    const filePath = path.join(standardsDir, file);
    const chunks = await processFile(filePath);
    allChunks = allChunks.concat(chunks);
  }
  
  await ingestChunks(allChunks);
}

main().catch(console.error);
