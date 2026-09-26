const fs = require('fs');
let c = fs.readFileSync('static/index.html', 'utf8');

const target = `const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8787'
            : PRODUCTION_URL;`;

const replacement = `const API_BASE = "http://localhost:5000";`;

c = c.replace(target, replacement);

// Fallback if formatting is different
c = c.replace(/const API_BASE[\s\S]*?;/, 'const API_BASE = "http://localhost:5000";');

fs.writeFileSync('static/index.html', c, 'utf8');
console.log("Patched API_BASE successfully");
