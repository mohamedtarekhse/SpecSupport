const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptStart = html.indexOf('<script>');
const pwaBanner = html.indexOf('id="pwa-install-banner"');
const pwaGuide = html.indexOf('id="pwa-guide-modal"');

console.log('1. PWA Modals Placement:');
console.log('   scriptStart pos:', scriptStart);
console.log('   pwaBanner pos:', pwaBanner, '(before <script>?', pwaBanner < scriptStart, ')');
console.log('   pwaGuide pos:', pwaGuide, '(before <script>?', pwaGuide < scriptStart, ')');

console.log('\n2. Export Functions:');
console.log('   has exportToPdf:', html.includes('function exportToPdf('));
console.log('   has exportToWord:', html.includes('function exportToWord('));
console.log('   has exportNCR:', html.includes('function exportNCR('));
console.log('   has prepareDocumentData:', html.includes('function prepareDocumentData('));

console.log('\n3. Viewport & Dimensions:');
console.log('   has #app-container overflow-y: auto:', html.includes('overflow-y: auto; overflow-x: hidden;'));
console.log('   has #greeting-area 16px 20px 10px 20px:', html.includes('padding: 16px 20px 10px 20px;'));
console.log('   obsolete 80px bottom pad removed:', !html.includes('20px 20px 80px 20px'));
console.log('   has .gemini-hero-headline 2.35rem:', html.includes('font-size: 2.35rem;'));
console.log('   has .state-greeting #input-container 14px bottom pad:', html.includes('padding: 0 20px 14px 20px;'));

console.log('\n4. Sidebar Search & Autofill Protection:');
console.log('   has autocomplete="off":', html.includes('id="source-search-input" placeholder="Filter standards & manuals..." autocomplete="off"'));
console.log('   has clear button:', html.includes('id="sidebar-search-clear-btn"'));
console.log('   has clearSidebarSearch:', html.includes('function clearSidebarSearch('));
console.log('   has empty state message:', html.includes('No matching standards'));
console.log('   has DOMContentLoaded autofill clear:', html.includes('Prevent Chrome autofill from hijacking the standards search filter'));

console.log('\n5. Syntax Verification (eval check):');
// Extract scripts and check for parse errors
const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
console.log('   Found', scripts.length, 'script tags in index.html.');
let allParsed = true;
scripts.forEach((s, idx) => {
    const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
        new Function(code);
    } catch (e) {
        console.error(`   Script #${idx + 1} parse error:`, e.message);
        allParsed = false;
    }
});
if (allParsed) {
    console.log('   ALL inline scripts parsed successfully with 0 errors!');
}
