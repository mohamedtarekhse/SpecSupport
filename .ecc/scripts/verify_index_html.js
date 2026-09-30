const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../../index.html');
const content = fs.readFileSync(file, 'utf8');

// Check script blocks for syntax errors
const scriptRegex = /<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let errors = 0;

while ((match = scriptRegex.exec(content)) !== null) {
  scriptIndex++;
  const js = match[1];
  try {
    new Function(js);
    console.log(`✓ Script block ${scriptIndex} is syntactically valid (${js.length} chars)`);
  } catch(e) {
    console.error(`✗ Script block ${scriptIndex} syntax error:`, e.message);
    errors++;
  }
}

// Check key IDs
const requiredIds = [
  'main-layout-container',
  'notebooklm-sidebar',
  'sidebar-toggle-btn',
  'sidebar-pillars-container',
  'active-scope-badge',
  'knowledge-curator-modal',
  'curator-edit-modal',
  'curator-std-select',
  'curator-search-input',
  'curator-table-body',
  'app-container',
  'greeting-area',
  'chat-window',
  'user-input',
  'mobile-menu-btn',
  'mobile-nav-drawer'
];

requiredIds.forEach(id => {
  if (content.includes(`id="${id}"`)) {
    console.log(`✓ Element with id="${id}" exists`);
  } else {
    console.error(`✗ Missing element with id="${id}"`);
    errors++;
  }
});

if (errors === 0) {
  console.log('\nAll index.html validations PASSED flawlessly!');
} else {
  console.error(`\nValidation failed with ${errors} error(s)!`);
  process.exit(1);
}
