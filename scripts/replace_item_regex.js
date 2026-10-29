const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace('const itemRegex = /<li[^>]*>([sS]*?)<\\/li>/gi;', 'const itemRegex = /<li[^>]*>([\\s\\S]*?)<\\/li>/gi;');
fs.writeFileSync('index.html', content, 'utf8');
console.log('Replaced itemRegex');
