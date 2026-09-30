const fs = require('fs');
const vm = require('vm');
const content = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/gi;
let match;
let idx = 0;
while ((match = scriptRegex.exec(content)) !== null) {
  idx++;
  try {
    new vm.Script(match[1], { filename: 'script_' + idx + '.js' });
    console.log('Script ' + idx + ' is valid.');
  } catch(e) {
    console.error('Error in script ' + idx + ':');
    console.error(e.stack);
  }
}
