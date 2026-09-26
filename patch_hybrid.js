const fs = require('fs');
const file = 'worker/src/index.js';
let content = fs.readFileSync(file, 'utf8');

const searchLogicStart = `  // Load chunks
  let query = \`SELECT id, standard_code, standard_name, clause, content, embedding FROM standards_chunks\`
  let params = []`;

const searchLogicReplacement = `  // Hybrid Search (BM25 + Vector) Setup
  let bm25Scores = {};
  try {
    const ftsTerm = question.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 2).join(" OR ");
    if (ftsTerm) {
      const { results: ftsRes } = await c.env.DB.prepare(\`SELECT rowid, bm25(standards_fts) as bm25_score FROM standards_fts WHERE standards_fts MATCH ?\`).bind(ftsTerm).all();
      // SQLite BM25 returns negative scores (more negative = better)
      ftsRes.sort((a,b) => a.bm25_score - b.bm25_score);
      ftsRes.forEach((r, rank) => { bm25Scores[r.rowid] = rank; });
    }
  } catch(e) { console.error('FTS Error:', e) }

  // Load chunks
  let query = \`SELECT id, standard_code, standard_name, clause, content, embedding FROM standards_chunks\`
  let params = []`;

content = content.replace(`  // Load chunks\n  let query = \`SELECT standard_code, standard_name, clause, content, embedding FROM standards_chunks\`\n  let params = []`, searchLogicReplacement);


const sortLogicReplacement = `  // Compute Vector Similarities
  let scoredChunks = (results || []).map(row => {
    let emb = []
    try { emb = JSON.parse(row.embedding) } catch(e){}
    let score = emb.length > 0 ? cosineSimilarity(questionEmbedding, emb) : -1
    return { ...row, vector_score: score }
  })
  
  // Rank Vector Scores
  scoredChunks.sort((a, b) => b.vector_score - a.vector_score)
  scoredChunks.forEach((chunk, rank) => { chunk.vector_rank = rank; })

  // Reciprocal Rank Fusion (RRF)
  const k = 60;
  scoredChunks.forEach(chunk => {
    const vScore = 1 / (k + chunk.vector_rank + 1);
    const bRank = bm25Scores[chunk.id] !== undefined ? bm25Scores[chunk.id] : 1000;
    const bScore = 1 / (k + bRank + 1);
    chunk.rrf_score = vScore + bScore;
  })

  // Final Hybrid Sort
  scoredChunks.sort((a, b) => b.rrf_score - a.rrf_score)
  const topChunks = scoredChunks.slice(0, 5)`;

content = content.replace(`  // Compute similarities
  let scoredChunks = (results || []).map(row => {
    let emb = []
    try { emb = JSON.parse(row.embedding) } catch(e){}
    let score = emb.length > 0 ? cosineSimilarity(questionEmbedding, emb) : -1
    return { ...row, score }
  })
  
  scoredChunks.sort((a, b) => b.score - a.score)
  const topChunks = scoredChunks.slice(0, 5)`, sortLogicReplacement);

fs.writeFileSync(file, content);
console.log('index.js updated for Hybrid Search!');
