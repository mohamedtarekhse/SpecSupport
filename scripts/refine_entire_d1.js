// scripts/refine_entire_d1.js
// Runs full genome refinement over all 6,971 chunks in Cloudflare D1

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const AUTH_TOKEN = 'specsupport-admin-2026';
const BATCH_SIZE = 250;

async function runRefinement() {
  console.log('🚀 Starting Universal API Genome Refinement on D1 Database...');
  let offset = 0;
  let totalProcessed = 0;
  const aggregateStats = {};

  const startTime = Date.now();

  while (true) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/refine-genome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({ batch_size: BATCH_SIZE, offset })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Batch error at offset ${offset} (status ${res.status}):`, errText);
        break;
      }

      const data = await res.json();
      if (!data.success) {
        console.error(`❌ Batch failed at offset ${offset}:`, data.error);
        break;
      }

      totalProcessed += data.processed;
      
      // Accumulate stats
      if (data.batch_stats) {
        for (const [pillar, count] of Object.entries(data.batch_stats)) {
          aggregateStats[pillar] = (aggregateStats[pillar] || 0) + count;
        }
      }

      console.log(`✅ Processed [${offset} -> ${offset + data.processed}] (${totalProcessed} chunks total). Batch pillars:`, data.batch_stats);

      if (!data.has_more || data.processed === 0) {
        console.log('\n🎉 Finished refining all chunks!');
        break;
      }

      offset = data.next_offset;
      // Small pause to be gentle on CF edge limits
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`❌ Network error at offset ${offset}:`, err.message);
      break;
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️ Total Execution Time: ${durationSec}s. Chunks processed: ${totalProcessed}`);
  console.log('📊 Aggregate Pillars from run:', aggregateStats);

  // Fetch final global stats from server
  try {
    const statsRes = await fetch(`${API_BASE}/api/admin/genome-stats`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    const finalStats = await statsRes.json();
    console.log('\n🏛️ Final D1 Database Genome Distribution:');
    console.log(JSON.stringify(finalStats, null, 2));
  } catch (err) {
    console.error('Failed to fetch final genome stats:', err);
  }
}

runRefinement();
