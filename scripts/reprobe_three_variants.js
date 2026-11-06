const https = require('https');

const variants = [
  {
    id: "PROBE-VAR-01",
    question: "What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?",
    session_id: "probe_var_01_" + Date.now()
  },
  {
    id: "PROBE-VAR-02",
    question: "Per ASME Section IX Table QW-422, what P-No and Group applies to SA-516 Gr 70 plate?",
    session_id: "probe_var_02_" + Date.now()
  },
  {
    id: "PROBE-VAR-03",
    question: "Identify the ASME IX QW-422 P-Number, Group, and tensile strength for SA-516 Grade 70.",
    session_id: "probe_var_03_" + Date.now()
  }
];

function sendProbe(v) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      question: v.question,
      language: "en",
      session_id: v.session_id,
      standard_filter: "🌐 DATABASE MODE",
      mode: "standards",
      selected_standards: []
    });

    const t0 = Date.now();
    const req = https.request('https://inspection-api.mohamedtarekhse.workers.dev/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            id: v.id,
            question: v.question,
            latency: Date.now() - t0,
            status: res.statusCode,
            mcqCount: parsed.mcq_questions ? parsed.mcq_questions.length : 0,
            scorePct: parsed.grounding ? parsed.grounding.score_pct : 0,
            badge: parsed.grounding ? parsed.grounding.badge : null,
            quote: parsed.grounding ? parsed.grounding.verbatim_evidence_quote : null,
            evidence: parsed.grounding ? parsed.grounding.evidence : null,
            answer: parsed.answer
          });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runProbes() {
  console.log("=========================================================================");
  console.log("🔍 PROBING 3 REWORDED VARIANTS OF ASME IX QW-422 SA-516 GR 70 LOOKUP");
  console.log("Target: 0 MCQs, Grounding Score >= 80%, Badge = VERIFIED_CODE_GROUNDED, Non-Empty Evidence Quote");
  console.log("=========================================================================\n");

  const results = [];
  for (const v of variants) {
    process.stdout.write(`▶ Probing [${v.id}]: "${v.question}"... `);
    try {
      const res = await sendProbe(v);
      console.log(`✅ Received in ${res.latency}ms`);
      console.log(`   ├─ MCQs emitted: ${res.mcqCount} (Expected: 0)`);
      console.log(`   ├─ Grounding Score: ${res.scorePct}% (Expected: >= 80%)`);
      console.log(`   ├─ Grounding Badge: ${res.badge} (Expected: VERIFIED_CODE_GROUNDED)`);
      console.log(`   ├─ Evidence Quote: "${(res.quote || '').replace(/\\n/g, ' ').slice(0, 100)}..."`);
      console.log(`   └─ Evidence Object: Standard=${res.evidence?.standard}, Clause=${res.evidence?.clause}\n`);
      results.push(res);
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}\n`);
      results.push({ id: v.id, error: err.message });
    }
  }

  const allPass = results.every(r => !r.error && r.mcqCount === 0 && r.scorePct >= 80 && r.badge === 'VERIFIED_CODE_GROUNDED' && Boolean(r.quote));
  console.log("=========================================================================");
  console.log(`🏆 PROBE VERIFICATION RESULT: ${allPass ? 'ALL 3 VARIANTS MET 100% SPEC' : 'SOME VARIANTS FAILED CRITERIA'}`);
  console.log("=========================================================================");
}

runProbes().catch(console.error);
