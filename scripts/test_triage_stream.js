async function test() {
  console.log('Testing streaming triage MCQs...');
  const res = await fetch('https://inspection-api.mohamedtarekhse.workers.dev/api/ask?stream=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: 'test_triage_' + Date.now(),
      question: 'I need a welding procedure specification',
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      history: []
    })
  });

  const text = await res.text();
  const lines = text.split('\n');
  for (const l of lines) {
    if (l.includes('"complete"')) {
      const jsonStr = l.replace(/^data:\s*/, '').trim();
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ COMPLETE EVENT RECEIVED:');
        console.log('MCQ Questions count:', parsed.mcq_questions?.length);
        console.log('MCQs:', JSON.stringify(parsed.mcq_questions, null, 2));
      } catch(e) {
        console.error('Failed to parse complete JSON:', e.message);
      }
    }
  }
}

test();
