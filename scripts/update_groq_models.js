const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'worker', 'src', 'index.js');
let code = fs.readFileSync(filePath, 'utf8');

// Replace decommissioned Groq models
code = code.replaceAll("'llama-3.1-70b-versatile'", "'llama-3.3-70b-versatile'");
code = code.replaceAll('"llama-3.1-70b-versatile"', '"llama-3.3-70b-versatile"');
code = code.replaceAll("'llama3-8b-8192'", "'llama-3.1-8b-instant'");
code = code.replaceAll('"llama3-8b-8192"', '"llama-3.1-8b-instant"');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated Groq models in worker/src/index.js');
