// scripts/reembed_v2_corpus.js
// Embeds standards_chunks_v2 via Cloudflare Workers AI with batch=20, exponential backoff,
// and graceful stop on CF 4006 quota limit.

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://inspection-api.mohamedtarekhse.workers.dev';
const ADMIN_TOKEN = 'specsupport-admin-2026';
const CHECKPOINT_FILE = path.resolve(__dirname, '..', '.backups', 'embed_v2_checkpoint.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
    } catch(e) {}
  }
  return { batches_run: 0, total_embedded: 0, last_run: null };
}

function saveCheckpoint(state) {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch(e) {}
}

async function runEmbeddingPipeline() {
  console.log('=========================================================================');
  console.log('⚡ ROSETTA 2.0 EMBEDDING PIPELINE (BGE Embeddings 20/req)');
  console.log('=========================================================================\n');

  const checkpoint = loadCheckpoint();
  console.log(`Starting run. Previous checkpoint: batches=${checkpoint.batches_run}, embedded=${checkpoint.total_embedded}`);

  let remaining = 1;
  let backoffMs = 500;
  let batchNum = checkpoint.batches_run;
  let totalEmbedded = checkpoint.total_embedded;

  while (remaining > 0) {
    batchNum++;
    try {
      const res = await fetch(`${API_BASE}/api/admin/backfill-embeddings?corpus=v2&limit=20`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 429 || res.status === 4006) {
        const txt = await res.text();
        console.warn(`\n🛑 CLOUDFLARE AI QUOTA LIMIT (4006/429) HIT:\n${txt}`);
        console.warn(`Gracefully stopping at batch ${batchNum}. Checkpoint saved.`);
        checkpoint.batches_run = batchNum;
        checkpoint.total_embedded = totalEmbedded;
        checkpoint.last_run = new Date().toISOString();
        checkpoint.stopped_reason = 'QUOTA_LIMIT_4006';
        saveCheckpoint(checkpoint);
        return { success: false, quota_limit: true, total_embedded: totalEmbedded, remaining };
      }

      if (!res.ok) {
        const txt = await res.text();
        console.warn(`⚠️ Batch ${batchNum} failed with HTTP ${res.status}: ${txt}`);
        if (txt.includes('4006') || txt.includes('quota')) {
          console.warn(`🛑 Quota error detected in response body. Stopping.`);
          checkpoint.batches_run = batchNum;
          checkpoint.total_embedded = totalEmbedded;
          checkpoint.last_run = new Date().toISOString();
          checkpoint.stopped_reason = 'QUOTA_LIMIT_4006';
          saveCheckpoint(checkpoint);
          return { success: false, quota_limit: true, total_embedded: totalEmbedded, remaining };
        }
        await sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, 16000);
        continue;
      }

      const data = await res.json();
      if (!data.success && data.remaining === 0) {
        console.log('\n🎉 ALL V2 CHUNKS ARE FULLY EMBEDDED!');
        break;
      }

      const processed = data.processed || 0;
      remaining = data.remaining !== undefined ? data.remaining : 0;
      totalEmbedded += processed;
      backoffMs = 500; // reset backoff on success

      process.stdout.write(`[Batch ${batchNum}] Embedded: +${processed} | Total: ${totalEmbedded} | Remaining in v2: ${remaining}\r`);

      checkpoint.batches_run = batchNum;
      checkpoint.total_embedded = totalEmbedded;
      checkpoint.last_run = new Date().toISOString();
      checkpoint.remaining = remaining;
      saveCheckpoint(checkpoint);

      if (remaining === 0) {
        console.log('\n\n🎉 ALL V2 CHUNKS ARE FULLY EMBEDDED!');
        break;
      }

      await sleep(250); // gentle pause between batches
    } catch(err) {
      console.error(`\nNetwork exception during batch ${batchNum}:`, err.message);
      await sleep(backoffMs);
      backoffMs = Math.min(backoffMs * 2, 16000);
    }
  }

  console.log(`\nPipeline finished. Total embedded: ${totalEmbedded}. Remaining: ${remaining}`);
  return { success: true, total_embedded: totalEmbedded, remaining };
}

if (require.main === module) {
  runEmbeddingPipeline().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runEmbeddingPipeline };
