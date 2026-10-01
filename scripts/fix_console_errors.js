const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

console.log('--- Fixing extract function inside parseWpsData ---');

const oldExtractSnippet = `            // 2. Robust Regex Fallback on markdown text
            const extract = (pattern, def = "As Specified") => {
                const m = rawText.match(pattern);
                return m ? m[1].trim() : def;
            };`;

const newExtractSnippet = `            // 2. Robust Regex Fallback on markdown text
            const extract = (pattern, def = "As Specified") => {
                try {
                    const m = rawText.match(pattern);
                    if (!m) return def;
                    const val = (m[1] !== undefined && m[1] !== null) ? m[1] : m[0];
                    return (typeof val === 'string' && val.trim().length > 0) ? val.trim() : def;
                } catch (e) {
                    return def;
                }
            };`;

if (html.includes(oldExtractSnippet)) {
    html = html.replace(oldExtractSnippet, newExtractSnippet);
    console.log('Fixed extract function safely with group fallback and try-catch.');
} else {
    // Regex replace if whitespace differed
    html = html.replace(
        /const extract = \(pattern, def = "As Specified"\) => \{[\s\S]*?return m \? m\[1\]\.trim\(\) : def;[\s\S]*?\};/,
        `const extract = (pattern, def = "As Specified") => {
                try {
                    const m = rawText.match(pattern);
                    if (!m) return def;
                    const val = (m[1] !== undefined && m[1] !== null) ? m[1] : m[0];
                    return (typeof val === 'string' && val.trim().length > 0) ? val.trim() : def;
                } catch (e) {
                    return def;
                }
            };`
    );
    console.log('Applied regex replacement for extract function.');
}

console.log('--- Defining populateCuratorStandardsFilter and guarding its call ---');

const populateCuratorFunctionJs = `
        function populateCuratorStandardsFilter() {
            const sel = document.getElementById('curator-std-select');
            if (!sel) return;
            const currentVal = sel.value;
            let opts = '<option value="">All Standards</option>';

            const seenStds = new Set();
            if (typeof DRILLING_PILLARS !== 'undefined' && Array.isArray(DRILLING_PILLARS)) {
                DRILLING_PILLARS.forEach(p => {
                    if (p && Array.isArray(p.standards)) {
                        p.standards.forEach(s => s && s.code && seenStds.add(s.code));
                    }
                });
            }
            if (typeof loadedCatalogStandards !== 'undefined' && Array.isArray(loadedCatalogStandards)) {
                loadedCatalogStandards.forEach(s => {
                    if (s && s.standard_code) seenStds.add(s.standard_code);
                });
            }

            Array.from(seenStds).sort().forEach(std => {
                opts += \`<option value="\${std}" \${std === currentVal ? 'selected' : ''}>\${std}</option>\`;
            });
            sel.innerHTML = opts;
        }
`;

if (!html.includes('function populateCuratorStandardsFilter()')) {
    html = html.replace('function renderNotebookLMSidebar(searchFilter = \'\') {', `${populateCuratorFunctionJs}\n        function renderNotebookLMSidebar(searchFilter = '') {`);
    console.log('Added missing populateCuratorStandardsFilter function definition.');
}

// Guard the call in initNotebookLMSidebar
html = html.replace(
    'populateCuratorStandardsFilter();',
    'if (typeof populateCuratorStandardsFilter === \'function\') populateCuratorStandardsFilter();'
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully written updated index.html with bug fixes.');
