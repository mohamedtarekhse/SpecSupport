// scripts/fix_format_param_box.js
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../index.html');
let content = fs.readFileSync(htmlPath, 'utf8');

const target = `        function formatParameterBox(html) {
            const paramBoxRegex = /(?:<p>s*<strong[^>]*>([sS]*?(?:Parameter Box|FIELD ACTION SUMMARY)[sS]*?)</strong>s*</p>|<h[2-4][^>]*>([sS]*?(?:Parameter Box|FIELD ACTION SUMMARY)[sS]*?)</h[2-4]>)s*<ul[^>]*>([sS]*?)</ul>/i;`;

const replacement = `        function formatParameterBox(html) {
            const paramBoxRegex = /(?:<p>\\s*<strong[^>]*>([^<]*?(?:Parameter Box|FIELD ACTION SUMMARY)[^<]*?)<\\/strong>\\s*<\\/p>|<h[2-4][^>]*>([^<]*?(?:Parameter Box|FIELD ACTION SUMMARY)[^<]*?)<\\/h[2-4]>)\\s*<ul[^>]*>([\\s\\S]*?)<\\/ul>/i;`;

const normalize = s => s.replace(/\r\n/g, '\n');
content = normalize(content);

if (content.includes(normalize(target))) {
  content = content.replace(normalize(target), normalize(replacement));
  console.log('✅ Regex fixed successfully in index.html!');
  fs.writeFileSync(htmlPath, content.replace(/\n/g, '\r\n'), 'utf8');
} else {
  console.error('Target not found for regex fix.');
}
