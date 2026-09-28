const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("   INSPECTA ECC PRE-FLIGHT & VERIFICATION SUITE  ");
console.log("   Methodology: affaan-m/ecc                     ");
console.log("=================================================\n");

let failures = 0;

function runCheck(name, fn) {
  process.stdout.write(`▶ [CHECK] ${name}... `);
  try {
    fn();
    console.log("✓ PASS");
  } catch(e) {
    console.log("✗ FAIL: " + e.message);
    failures++;
  }
}

// Check 1: Working branch is 'final'
runCheck("Git Working Branch is 'final'", () => {
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch !== 'final') throw new Error(`Expected branch 'final', found '${branch}'`);
});

// Check 2: Worker Syntax
runCheck("Cloudflare Worker JavaScript Syntax", () => {
  execSync('node -c worker/src/index.js');
});

// Check 3: HTML Blocking Scripts Check (Lazy Tesseract verified)
runCheck("HTML Asset Loading (No Blocking Tesseract in Head)", () => {
  const html = fs.readFileSync('index.html', 'utf8');
  if (html.includes('<script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>')) {
    throw new Error("Blocking Tesseract script tag found in HTML head");
  }
  if (!html.includes('ensureTesseractLoaded')) {
    throw new Error("Missing ensureTesseractLoaded dynamic loader in HTML");
  }
});

// Check 4: Ingestion Batch Route Existence
runCheck("Worker Batch Ingestion Endpoint (/api/admin/ingest-batch)", () => {
  const worker = fs.readFileSync('worker/src/index.js', 'utf8');
  if (!worker.includes("app.post('/api/admin/ingest-batch'")) {
    throw new Error("Worker missing /api/admin/ingest-batch route definition");
  }
});

// Check 5: SSE Streaming Endpoint Existence
runCheck("Worker SSE Streaming Engine (/api/ask?stream=true)", () => {
  const worker = fs.readFileSync('worker/src/index.js', 'utf8');
  if (!worker.includes("text/event-stream") || !worker.includes("TransformStream")) {
    throw new Error("Worker missing SSE streaming TransformStream definition");
  }
});

// Check 6: ECC Memory & Rules Existence
runCheck("ECC Harness Architecture (.ecc/ memory, rules, instincts)", () => {
  const reqFiles = [
    '.ecc/workflow/cycle.md',
    '.ecc/rules/engineering_rules.md',
    '.ecc/instincts/developer_instincts.md',
    '.ecc/memory/project_memory.json'
  ];
  for (const f of reqFiles) {
    if (!fs.existsSync(f)) throw new Error(`Missing ECC harness file: ${f}`);
  }
});

console.log("\n=================================================");
if (failures === 0) {
  console.log(" ECC PRE-FLIGHT VERIFICATION: ALL CHECKS PASSED ✓");
  console.log(" Cycle is ready for deployment and production verification.");
  console.log("=================================================\n");
  process.exit(0);
} else {
  console.error(` ECC PRE-FLIGHT VERIFICATION: ${failures} CHECK(S) FAILED ✗`);
  console.log("=================================================\n");
  process.exit(1);
}
