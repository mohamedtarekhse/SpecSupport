const fs = require('fs');

let worker = fs.readFileSync('worker/src/index.js', 'utf8');

// 1. Upgrade Cloudflare AI max_tokens from 2200 to 4096
worker = worker.split('max_tokens: 2200,').join('max_tokens: 4096,');

// 2. Upgrade Groq max_tokens from 1000 to 4096 in provider calls
worker = worker.split("runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 1000)")
               .join("runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 4096)");

worker = worker.split("runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', m, 1000)")
               .join("runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', m, 4096)");

// 3. Make runHttpProvider default to 4096 tokens rather than null
worker = worker.split("const runHttpProvider = async (providerName, key, url, modelToUse, maxTokens = null) => {")
               .join("const runHttpProvider = async (providerName, key, url, modelToUse, maxTokens = 4096) => {");

// 4. Increase HTTP connection timeout from 5,000ms to 20,000ms
worker = worker.split("const timeoutId = setTimeout(() => controller.abort(), 5000);")
               .join("const timeoutId = setTimeout(() => controller.abort(), 20000);");

worker = worker.split("recordProviderFailure(providerName, err.name === 'AbortError' ? 'Timeout (5000ms)' : err.message);")
               .join("recordProviderFailure(providerName, err.name === 'AbortError' ? 'Timeout (20000ms)' : err.message);");

// 5. Fix greedy regex that strips question headings down to $ (end of document)
const oldLine = "answer = answer.replace(/###\\s*❓?\\s*(?:Clarifying|Follow-up|Suggested|Potential)\\s*Questions[\\s\\S]*?(?=\\n###|\\n\\*\\*Detailed|\\n\\*\\*Quality|\\n\\*\\*1\\.|\\n\\*\\*The Code|$)/gi, '').trim()";
const newLine = "// Safe question cleanup without greedy end-of-text truncation\n    answer = answer.replace(/###\\s*❓?\\s*(?:Clarifying|Follow-up|Suggested|Potential)\\s*Questions[\\s\\S]*?(?=\\n###|\\n##|\\n#[^#]|\\n\\*\\*[A-Z]|\\n[0-9]+\\.\\s+[A-Z]|$)/gi, '').trim()";

if (worker.includes(oldLine)) {
  worker = worker.replace(oldLine, newLine);
  console.log('Successfully replaced question stripping regex in worker');
} else {
  console.log('Old regex pattern not found verbatim, checking substring match...');
}

fs.writeFileSync('worker/src/index.js', worker, 'utf8');
console.log('Worker updated.');

// Also update index.html regex
let html = fs.readFileSync('index.html', 'utf8');
const oldHtmlRegex = ".replace(/###\\s*❓?\\s*(?:Clarifying|Follow-up|Suggested|Potential)\\s*Questions[\\s\\S]*?(?=\\n###|\\n\\*\\*Detailed|\\n\\*\\*Quality|\\n\\*\\*1\\.|\\n\\*\\*The Code|$)/gi, '')";
const newHtmlRegex = ".replace(/###\\s*❓?\\s*(?:Clarifying|Follow-up|Suggested|Potential)\\s*Questions[\\s\\S]*?(?=\\n###|\\n##|\\n#[^#]|\\n\\*\\*[A-Z]|\\n[0-9]+\\.\\s+[A-Z]|$)/gi, '')";

if (html.includes(oldHtmlRegex)) {
  html = html.replace(oldHtmlRegex, newHtmlRegex);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('index.html regex updated successfully.');
} else {
  console.log('index.html old regex not matched verbatim.');
}
