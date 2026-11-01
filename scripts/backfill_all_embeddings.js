// scripts/backfill_all_embeddings.js
// Continuously calls /api/admin/backfill-embeddings until all chunks have vector embeddings.

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = 'specsupport-admin-2026';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function backfillAll() {
  console.log('====================================================');
  console.log('⚡ D1 VECTOR EMBEDDING BACKFILL PIPELINE');
  console.log('====================================================');

  let totalProcessed = 0;
  let remaining = 1;
  let iteration = 0;

  while (remaining > 0) {
    iteration++;
    try {
      const res = await fetch(`${API_BASE}/api/admin/backfill-embeddings?limit=30`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(`❌ Batch ${iteration} failed with HTTP ${res.status}:`, txt);
        await sleep(3000);
        continue;
      }

      const data = await res.json();
      if (!data.success && data.remaining === 0) {
        console.log('✅ Backfill complete! All chunks are fully embedded.');
        break;
      }

      totalProcessed += data.processed || 0;
      remaining = data.remaining;

      console.log(`[Batch ${iteration}] Processed: ${data.processed} | Remaining: ${remaining} chunks`);

      if (remaining === 0) {
        console.log('✨ All chunks successfully embedded!');
        break;
      }

      // Small pause to avoid CF AI rate limits
      await sleep(1000);
    } catch (err) {
      console.error(`⚠️ Exception in batch ${iteration}:`, err.message);
      await sleep(3000);
    }
  }

  console.log('====================================================');
  console.log(`🎉 Pipeline Complete: ${totalProcessed} total chunks embedded into D1!`);
  console.log('====================================================');
}

backfillAll();
