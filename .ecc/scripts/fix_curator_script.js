const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../../index.html');
let content = fs.readFileSync(file, 'utf8');

// Replace the buggy onclick and openCuratorEditModal
const targetRow = `<button class="curator-action-btn" title="Edit & Re-Embed" onclick="openCuratorEditModal(\${chunk.id}, '\${(chunk.standard_code||'').replace(/'/g, "\\\\'")}', '\${(chunk.clause||'').replace(/'/g, "\\\\'")}', '\${(chunk.section||'').replace(/'/g, "\\\\'")}', \`\${encodeURIComponent(chunk.content||'')}\`)">✏️</button>`;

const replacementRow = `<button class="curator-action-btn" title="Edit & Re-Embed" onclick="openCuratorEditModal(\${chunk.id})">✏️</button>`;

// Also add let curatorChunksMap = {};
const curatorStateTarget = `let currentCuratorPage = 1;
        let totalCuratorPages = 1;
        let selectedChunkIds = new Set();`;

const curatorStateReplacement = `let currentCuratorPage = 1;
        let totalCuratorPages = 1;
        let selectedChunkIds = new Set();
        let curatorChunksMap = {};`;

// Also update renderCuratorTable to populate curatorChunksMap
const renderTableTarget = `const chunks = data.chunks || [];
            const total = data.total || 0;`;

const renderTableReplacement = `const chunks = data.chunks || [];
            const total = data.total || 0;
            curatorChunksMap = {};
            chunks.forEach(c => { curatorChunksMap[c.id] = c; });`;

// And update openCuratorEditModal
const editModalFuncTarget = `function openCuratorEditModal(id, std, clause, section, encContent) {
            const modal = document.getElementById('curator-edit-modal');
            if (!modal) return;
            document.getElementById('edit-chunk-id').value = id;
            document.getElementById('edit-chunk-std').value = std;
            document.getElementById('edit-chunk-clause').value = clause;
            document.getElementById('edit-chunk-section').value = section;
            const content = decodeURIComponent(encContent);
            const textarea = document.getElementById('edit-chunk-content');
            textarea.value = content;
            document.getElementById('edit-chunk-char-count').textContent = content.length + ' chars';
            modal.style.display = 'flex';
        }`;

const editModalFuncReplacement = `function openCuratorEditModal(id) {
            const modal = document.getElementById('curator-edit-modal');
            const chunk = curatorChunksMap[id];
            if (!modal || !chunk) return;
            document.getElementById('edit-chunk-id').value = chunk.id;
            document.getElementById('edit-chunk-std').value = chunk.standard_code || '';
            document.getElementById('edit-chunk-clause').value = chunk.clause || '';
            document.getElementById('edit-chunk-section').value = chunk.section || '';
            const content = chunk.content || '';
            const textarea = document.getElementById('edit-chunk-content');
            textarea.value = content;
            document.getElementById('edit-chunk-char-count').textContent = content.length + ' chars';
            modal.style.display = 'flex';
        }`;

// Normalize line breaks
const norm = s => s.replace(/\r\n/g, '\n');
content = norm(content);

if (content.includes(norm(targetRow))) {
  content = content.replace(norm(targetRow), norm(replacementRow));
  console.log('✓ Fixed curator row button');
} else {
  console.error('✗ targetRow not found');
}

if (content.includes(norm(curatorStateTarget))) {
  content = content.replace(norm(curatorStateTarget), norm(curatorStateReplacement));
  console.log('✓ Updated curator state');
} else {
  console.error('✗ curatorStateTarget not found');
}

if (content.includes(norm(renderTableTarget))) {
  content = content.replace(norm(renderTableTarget), norm(renderTableReplacement));
  console.log('✓ Updated renderCuratorTable mapping');
} else {
  console.error('✗ renderTableTarget not found');
}

if (content.includes(norm(editModalFuncTarget))) {
  content = content.replace(norm(editModalFuncTarget), norm(editModalFuncReplacement));
  console.log('✓ Updated openCuratorEditModal');
} else {
  console.error('✗ editModalFuncTarget not found');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Curator script successfully updated!');
