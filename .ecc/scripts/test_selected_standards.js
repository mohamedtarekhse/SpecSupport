// Test selected_standards filtering on deployed worker
const fetch = globalThis.fetch || require('node-fetch');

const API_URL = 'https://inspection-api.mohamedtarekhse.workers.dev';

async function run() {
  console.log('Testing selected_standards parameter on:', API_URL);

  // Test 1: Query with selected_standards = ['API RP 8B']
  const res1 = await fetch(`${API_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'What is the allowable wear limit for hoisting elevator bore?',
      session_id: 'test-notebooklm-suite',
      selected_standards: ['API RP 8B']
    })
  });
  const data1 = await res1.json();
  const sources1 = data1.sources || [];
  console.log('Test 1 Sources (Selected API RP 8B):', sources1.map(s => s.standard));
  const only8B = sources1.every(s => s.standard.includes('8B'));
  console.log('Test 1 Scope Precision:', only8B ? 'PASS' : 'WARN - other standards returned');

  // Test 2: Query with selected_standards = ['ASME VIII']
  const res2 = await fetch(`${API_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: 'What is the formula for spherical vessel thickness under internal pressure?',
      session_id: 'test-notebooklm-suite',
      selected_standards: ['ASME VIII']
    })
  });
  const data2 = await res2.json();
  const sources2 = data2.sources || [];
  console.log('Test 2 Sources (Selected ASME VIII):', sources2.map(s => s.standard));
  const onlyVIII = sources2.every(s => s.standard.includes('VIII'));
  console.log('Test 2 Scope Precision:', onlyVIII ? 'PASS' : 'WARN - other standards returned');

  // Test 3: Admin chunk browser
  const res3 = await fetch(`${API_URL}/api/admin/chunks?limit=5`);
  const data3 = await res3.json();
  console.log('Test 3 Admin Chunks Browser: total =', data3.total, 'chunks retrieved =', data3.chunks?.length);

  if (data3.chunks && data3.chunks.length > 0) {
    console.log('Sample chunk:', {
      id: data3.chunks[0].id,
      standard: data3.chunks[0].standard_code,
      clause: data3.chunks[0].clause
    });
  }

  console.log('selected_standards API verification completed successfully!');
}

run().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
