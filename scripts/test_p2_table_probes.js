const fetch = globalThis.fetch;

const probes = [
  {
    name: 'QW-422 SA-516 Gr 70',
    question: 'What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?',
    standard_filter: '🌐 DATABASE MODE',
    mode: 'standards',
    expectedTableClause: 'Table QW/QB-422'
  },
  {
    name: 'API 1104 foot-run acceptance table',
    question: 'What are the foot-run acceptance limits in API 1104 Table 1 for weld discontinuities?',
    standard_filter: '🌐 DATABASE MODE',
    mode: 'standards',
    expectedTableClause: 'Table 1'
  },
  {
    name: 'ASME B31.3 wall-thickness table',
    question: 'What are the wall-thickness and undercut acceptance limits in ASME B31.3 Table 341.3.2?',
    standard_filter: '🌐 DATABASE MODE',
    mode: 'standards',
    expectedTableClause: 'Table 341.3.2'
  }
];

async function run() {
  console.log("=========================================================================");
  console.log("🔍 TESTING P2.2 TABLE ROW RETRIEVAL ACCEPTANCE PROBES");
  console.log("=========================================================================\n");

  let allPassed = true;

  for (const p of probes) {
    console.log(`Probe: ${p.name}`);
    console.log(`Question: "${p.question}"`);

    const res = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: p.question,
        language: 'en',
        session_id: `probe_p2_${Date.now()}`,
        standard_filter: p.standard_filter,
        mode: p.mode,
        selected_standards: []
      })
    });

    const data = await res.json();
    const sources = data.sources || [];
    console.log(`Returned sources count: ${sources.length}`);

    // Check Source #1 and #2
    const s1 = sources[0];
    const s2 = sources[1];
    console.log(`Source #1: standard=${s1?.standard}, clause=${s1?.clause}, source_type=${s1?.source_type || s1?.type}`);
    if (s2) {
      console.log(`Source #2: standard=${s2?.standard}, clause=${s2?.clause}, source_type=${s2?.source_type || s2?.type}`);
    }

    const hitInTop2 = (s1 && (s1.clause?.includes(p.expectedTableClause) || s1.source_type === 'table_row')) ||
                      (s2 && (s2.clause?.includes(p.expectedTableClause) || s2.source_type === 'table_row'));

    console.log(`Grounding: score=${data.grounding?.score_pct}%, badge=${data.grounding?.badge}`);
    console.log(`MCQs emitted: ${(data.mcq_questions || []).length}`);
    console.log(`Result: ${hitInTop2 ? '✓ PASS (Table row is Source #1 or #2)' : '✗ FAIL (Table row missing in top 2)'}\n`);

    if (!hitInTop2) allPassed = false;
  }

  if (allPassed) {
    console.log("🎉 ALL P2.2 TABLE-ROW RETRIEVAL PROBES PASSED!");
  } else {
    console.log("⚠️ Some probes failed top-2 table row retrieval requirement.");
    process.exit(1);
  }
}

run().catch(console.error);
