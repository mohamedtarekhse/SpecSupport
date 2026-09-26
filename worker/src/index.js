import { Hono } from 'hono'

const app = new Hono()

// Robust CORS ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â handles preflight OPTIONS for all routes
app.use('*', async (c, next) => {
  // Always set CORS headers
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Title, HTTP-Referer, X-Model')
  c.header('Access-Control-Max-Age', '600')

  // Immediately respond to preflight
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }

  return next()
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', model: c.env.OPENROUTER_MODEL || 'qwen/qwen3.8-27b:free' })
})

app.post('/api/admin/config', async (c) => {
    const token = c.req.header('Authorization')
    if (!token || token !== `Bearer ${c.env.ADMIN_SECRET}`) return c.json({ error: 'Unauthorized' }, 401)
    try {
      const { openrouter_api_key, groq_api_key, active_provider } = await c.req.json()
      
      if (openrouter_api_key) await c.env.DB.prepare(`INSERT INTO system_config (key, value) VALUES ('openrouter_api_key', ?) ON CONFLICT(key) DO UPDATE SET value = ?`).bind(openrouter_api_key, openrouter_api_key).run()
      if (groq_api_key) await c.env.DB.prepare(`INSERT INTO system_config (key, value) VALUES ('groq_api_key', ?) ON CONFLICT(key) DO UPDATE SET value = ?`).bind(groq_api_key, groq_api_key).run()
      if (active_provider) await c.env.DB.prepare(`INSERT INTO system_config (key, value) VALUES ('active_provider', ?) ON CONFLICT(key) DO UPDATE SET value = ?`).bind(active_provider, active_provider).run()
      
      return c.json({ success: true })
    } catch (e) { return c.json({ error: e.message }, 500) }
  })
  
  app.post('/api/usage/check', async (c) => {
  try {
    const { session_id } = await c.req.json()
    if (!session_id) return c.json({ error: 'Missing session_id' }, 400)
    
    const today = new Date().toISOString().split('T')[0]
    
    const usageRes = await c.env.DB.prepare(
      `SELECT count(*) as count FROM usage_log WHERE session_id = ? AND date = ?`
    ).bind(session_id, today).first()
    
    const count = usageRes ? usageRes.count : 0
    
    const subRes = await c.env.DB.prepare(
      `SELECT daily_limit FROM user_subscriptions WHERE session_id = ?`
    ).bind(session_id).first()
    
    const limit = subRes ? subRes.daily_limit : 9999
    
    return c.json({
      questions_today: count,
      limit: limit,
      can_ask: count < limit
    })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/earn/questions', async (c) => {
  try {
    // Fetch 5 gold standard and 15 regular active questions
    const gold = await c.env.DB.prepare(
      `SELECT id, question_text, is_gold_standard FROM crowdsource_questions WHERE is_gold_standard = 1 AND is_active = 1 ORDER BY RANDOM() LIMIT 5`
    ).all()
    
    const regular = await c.env.DB.prepare(
      `SELECT id, question_text, is_gold_standard FROM crowdsource_questions WHERE is_gold_standard = 0 AND is_active = 1 ORDER BY RANDOM() LIMIT 15`
    ).all()
    
    const questions = [...(gold.results || []), ...(regular.results || [])]
    // Shuffle them so gold standards aren't all at the beginning
    questions.sort(() => Math.random() - 0.5)
    
    return c.json({ questions })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/earn/submit', async (c) => {
  try {
    const { session_id, answers, expert_name, expert_linkedin } = await c.req.json()
    if (!session_id || !answers || !Array.isArray(answers)) {
      return c.json({ error: 'Invalid input' }, 400)
    }

    // 1. Validate Gold Standard answers
    const goldIds = answers.map(a => a.question_id)
    const placeholders = goldIds.map(() => '?').join(',')
    
    if (goldIds.length === 0) return c.json({ error: 'No answers' }, 400)

    const questions = await c.env.DB.prepare(
      `SELECT id, is_gold_standard, gold_answer_keywords FROM crowdsource_questions WHERE id IN (${placeholders})`
    ).bind(...goldIds).all()

    let passedGold = true
    let goldCount = 0

    for (const ans of answers) {
      const q = questions.results.find(x => x.id === ans.question_id)
      if (q && q.is_gold_standard) {
        goldCount++
        const keywords = q.gold_answer_keywords.toLowerCase().split(',').map(k => k.trim())
        const userAns = ans.user_answer.toLowerCase()
        const hasKeyword = keywords.some(k => userAns.includes(k))
        if (!hasKeyword) {
          passedGold = false
        }
      }
    }

    if (!passedGold || goldCount === 0) {
      // Failed gold standard. Don't increase quota, reject answers.
      return c.json({ success: false, reason: 'Failed expert verification' })
    }

    // 2. Save pending answers
    const stmt = c.env.DB.prepare(
      `INSERT INTO crowdsource_answers (question_id, session_id, user_answer, status) VALUES (?, ?, ?, 'pending')`
    )
    const batch = answers.map(a => stmt.bind(a.question_id, session_id, a.user_answer))
    await c.env.DB.batch(batch)

    // 3. Upgrade quota and save expert info
    await c.env.DB.prepare(
      `INSERT INTO user_subscriptions (session_id, daily_limit, expert_name, expert_linkedin) VALUES (?, 50, ?, ?)
       ON CONFLICT(session_id) DO UPDATE SET daily_limit = 50, expert_name = ?, expert_linkedin = ?, updated_at = CURRENT_TIMESTAMP`
    ).bind(session_id, expert_name || null, expert_linkedin || null, expert_name || null, expert_linkedin || null).run()

    return c.json({ success: true, new_limit: 50 })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/admin/ingest', async (c) => {
  const token = c.req.header('Authorization')
  if (!token || token !== `Bearer ${c.env.ADMIN_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const chunk = await c.req.json()
    const { standard_code, standard_name, section, clause, content } = chunk
    
    // Create embedding
    const aiResp = await c.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [content] })
    const embedding = JSON.stringify(aiResp.data?.[0] ?? aiResp?.[0] ?? [])
    
    await c.env.DB.prepare(
      `INSERT INTO standards_chunks (standard_code, standard_name, section, clause, content, embedding)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(standard_code, standard_name, section, clause, content, embedding).run()
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/admin/rules', async (c) => {
  const token = c.req.header('Authorization')
  if (!token || token !== `Bearer ${c.env.ADMIN_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { keyword, instruction } = await c.req.json()
    if (!keyword || !instruction) return c.json({ error: 'Missing fields' }, 400)
    
    await c.env.DB.prepare(
      `INSERT INTO ndt_rules (keyword, instruction) VALUES (?, ?)`
    ).bind(keyword, instruction).run()
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/admin/config', async (c) => {
  const token = c.req.header('Authorization')
  if (!token || token !== `Bearer ${c.env.ADMIN_SECRET}`) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const res = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
    let config = {}
    if (res.results) {
      res.results.forEach(row => config[row.key] = row.value)
    }
    return c.json({ config })
  } catch (e) { return c.json({ error: e.message }, 500) }
})

app.post('/api/admin/config', async (c) => {
  const token = c.req.header('Authorization')
  if (!token || token !== `Bearer ${c.env.ADMIN_SECRET}`) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const { openrouter_api_key, openrouter_model } = await c.req.json()
    
    if (openrouter_api_key !== undefined) {
      await c.env.DB.prepare(`INSERT INTO system_config (key, value) VALUES ('openrouter_api_key', ?) ON CONFLICT(key) DO UPDATE SET value = ?`).bind(openrouter_api_key, openrouter_api_key).run()
    }
    if (openrouter_model !== undefined) {
      await c.env.DB.prepare(`INSERT INTO system_config (key, value) VALUES ('openrouter_model', ?) ON CONFLICT(key) DO UPDATE SET value = ?`).bind(openrouter_model, openrouter_model).run()
    }
    return c.json({ success: true })
  } catch (e) { return c.json({ error: e.message }, 500) }
})

app.post('/api/admin/compare', async (c) => {
  const token = c.req.header('Authorization')
  if (!token || token !== `Bearer ${c.env.ADMIN_SECRET}`) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const { question, standard_filter } = await c.req.json()
    if (!question) return c.json({ error: 'Missing question' }, 400)

    const confRes = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
    let dbConf = {}
    if (confRes.results) confRes.results.forEach(r => dbConf[r.key] = r.value)
    
    const apiKey = dbConf['openrouter_api_key'] || c.env.OPENROUTER_API_KEY
    const primaryModel = dbConf['openrouter_model'] || c.env.OPENROUTER_MODEL || 'qwen/qwen3.8-27b:free'

    if (!apiKey) return c.json({ error: 'No API key configured' }, 400)

    const contextData = await prepareContextAndMessages(c, question, 'en', 'admin', standard_filter)
    const { messages } = contextData

    const modelsToTest = [...new Set([primaryModel, ...fallbackModels])]
    
    const promises = modelsToTest.map(async (model) => {
      try {
        const start = Date.now()
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": c.env.ALLOWED_ORIGIN || '*',
            "X-Title": "Inspecta Admin"
          },
          body: JSON.stringify({ model: model, messages: messages, max_tokens: 1000, temperature: 0.1 })
        })
        const duration = Date.now() - start
        if (!response.ok) {
          const errText = await response.text()
          return { model, error: errText, duration }
        }
        const json = await response.json()
        return { model, answer: json.choices[0].message.content, duration }
      } catch (e) {
        return { model, error: e.message, duration: 0 }
      }
    })

    const results = await Promise.all(promises)
    return c.json({ results })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0; let normA = 0; let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]; normA += vecA[i] * vecA[i]; normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

const fallbackModels = [
  'nvidia/nemotron-3-super-120b-a12b:free',   // 120B ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â NVIDIA flagship
  'nvidia/nemotron-3-ultra-550b-a55b:free',   // 550B ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â largest free model on OpenRouter
  'google/gemma-4-31b-it:free',               // 31B instruction-tuned
  'nex-agi/nex-n2.5-pro:free',                // reasoning specialist
  'thinkingmachines/inkling:free'             // large context reasoning
]

async function askAIProvider(c, messages, stream) {
    const confRes = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
    let dbConf = {}
    if (confRes.results) confRes.results.forEach(r => dbConf[r.key] = r.value)
  
    const openrouterKey = dbConf['openrouter_api_key'] || c.env.OPENROUTER_API_KEY
    const groqKey = dbConf['groq_api_key'] || c.env.GROQ_API_KEY
    const activeProvider = dbConf['active_provider'] || 'openrouter'
    
    let primaryModel = dbConf['openrouter_model'] || c.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free'
    
    // We try the active provider first, then fallback to the other
    const providers = [];
    if (activeProvider === 'groq' && groqKey) {
        providers.push({ name: 'groq', key: groqKey, url: 'https://api.groq.com/openai/v1/chat/completions', models: ['llama-3.1-70b-versatile', 'llama3-8b-8192'] });
        if (openrouterKey) providers.push({ name: 'openrouter', key: openrouterKey, url: 'https://openrouter.ai/api/v1/chat/completions', models: [primaryModel, ...fallbackModels] });
    } else {
        if (openrouterKey) providers.push({ name: 'openrouter', key: openrouterKey, url: 'https://openrouter.ai/api/v1/chat/completions', models: [primaryModel, ...fallbackModels] });
        if (groqKey) providers.push({ name: 'groq', key: groqKey, url: 'https://api.groq.com/openai/v1/chat/completions', models: ['llama-3.1-70b-versatile', 'llama3-8b-8192'] });
    }

    if (providers.length === 0) throw new Error('No AI Provider API Keys configured in DB or Env')
  
    let lastError = null
  
    for (const provider of providers) {
        for (const model of provider.models) {
            try {
                const response = await fetch(provider.url, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${provider.key}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": c.env.ALLOWED_ORIGIN || '*',
                        "X-Title": "Inspecta"
                    },
                    body: JSON.stringify({ model: model, messages: messages, max_tokens: 1000, temperature: 0.1, stream: stream })
                })
                
                if (!response.ok) { 
                    lastError = await response.text(); 
                    // If rate limited, skip to next provider
                    if (response.status === 429) break; 
                    continue; 
                }
                return { response, model, provider: provider.name }
            } catch (e) { lastError = e.message }
        }
    }
    throw new Error(`RATE_LIMIT_ALL: ${lastError}`)
}

async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history = []) {
  const confRes = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
  let dbConf = {}
  if (confRes.results) confRes.results.forEach(r => dbConf[r.key] = r.value)
  const apiKey = dbConf['openrouter_api_key'] || c.env.OPENROUTER_API_KEY || '';

  // Usage check
  const today = new Date().toISOString().split('T')[0]
  if (session_id !== 'admin') {
    const usageRes = await c.env.DB.prepare(
      `SELECT count(*) as count FROM usage_log WHERE session_id = ? AND date = ?`
    ).bind(session_id, today).first()
    
    const count = usageRes ? usageRes.count : 0
    
    const subRes = await c.env.DB.prepare(
      `SELECT daily_limit FROM user_subscriptions WHERE session_id = ?`
    ).bind(session_id).first()
    
    const limit = subRes ? subRes.daily_limit : 9999
    
    if (count >= limit) {
      throw new Error('RATE_LIMIT')
    }
  }

  // Fetch active dynamic context rules
  const rulesRes = await c.env.DB.prepare(`SELECT keyword, instruction FROM ndt_rules WHERE is_active = 1`).all()
  let appliedRules = ""
  if (rulesRes.results) {
    const qLower = question.toLowerCase()
    for (const rule of rulesRes.results) {
      if (qLower.includes(rule.keyword.toLowerCase())) {
        appliedRules += `- ${rule.instruction}\n`
      }
    }
  }

  // HyDE (Hypothetical Document Embeddings) with High-Speed Caching
  let searchQuestion = question;
  if (standard_filter !== '🌐 GENERAL AI') {
    try {
      const cachedHyde = await c.env.DB.prepare('SELECT hyde_text FROM hyde_cache WHERE question = ?').bind(question).first('hyde_text');
      
      if (cachedHyde) {
        searchQuestion = question + "\n\n" + cachedHyde;
      } else {
        const hydePrompt = `You are an expert oil and gas engineer. Write a formal, hypothetical standard clause that perfectly answers this question: "${question}". Do not write an intro, just the formal technical text.`
        
        // Fetching from Groq/OpenRouter fallback (we leave it as OpenRouter but logic remains)
        // Use Groq for HyDE if available because it's 10x faster
        const groqKey = dbConf['groq_api_key'] || c.env.GROQ_API_KEY;
        const hydeUrl = groqKey ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
        const hydeKey = groqKey || apiKey;
        const hydeModel = groqKey ? 'llama3-8b-8192' : 'meta-llama/llama-3.1-8b-instruct:free';
        
        const hydeRes = await fetch(hydeUrl, {
          method: "POST",
          headers: { "Authorization": `Bearer ${hydeKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: hydeModel,
            messages: [{role: 'user', content: hydePrompt}],
            max_tokens: 150,
            temperature: 0.1
          })
        });
        const hydeData = await hydeRes.json();
        if (hydeData && hydeData.choices && hydeData.choices[0].message.content) {
          const generatedHyde = hydeData.choices[0].message.content.trim();
          searchQuestion = question + "\n\n" + generatedHyde;
          
          c.executionCtx.waitUntil(
             c.env.DB.prepare('INSERT OR IGNORE INTO hyde_cache (question, hyde_text) VALUES (?, ?)').bind(question, generatedHyde).run()
          );
        }
      }
    } catch(e) { console.error('HyDE Error:', e.message) }
  }

  // Embed question (or HyDE text) using Workers AI
  let questionEmbedding = []
  try {
    const aiResp = await c.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [searchQuestion] })
    // Workers AI returns { data: [ [floats] ] } for batch or { data: [[floats]] }
    questionEmbedding = aiResp.data?.[0] ?? aiResp?.[0] ?? []
  } catch(embErr) {
    // If embedding fails, fall back to keyword search (no vector scoring)
    console.error('Embedding failed:', embErr.message)
  }
  
  // Hybrid Search (BM25 + Vector) Setup
  let bm25Scores = {};
  try {
    const ftsTerm = question.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 2).join(" OR ");
    if (ftsTerm) {
      const { results: ftsRes } = await c.env.DB.prepare(`SELECT rowid, bm25(standards_fts) as bm25_score FROM standards_fts WHERE standards_fts MATCH ?`).bind(ftsTerm).all();
      // SQLite BM25 returns negative scores (more negative = better)
      ftsRes.sort((a,b) => a.bm25_score - b.bm25_score);
      ftsRes.forEach((r, rank) => { bm25Scores[r.rowid] = rank; });
    }
  } catch(e) { console.error('FTS Error:', e.message) }

  // Load chunks
  let query = `SELECT id, standard_code, standard_name, clause, content, embedding FROM standards_chunks`
  let params = []
  
  if (standard_filter && standard_filter !== 'ALL') {
    query += ` WHERE standard_code = ?`
    params.push(standard_filter)
  }
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all()
  
  // Compute Vector Similarities
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
  const topChunks = scoredChunks.slice(0, 5)
  
  let contextText = ""
  let sources = []
  topChunks.forEach((chunk, idx) => {
    contextText += `[Source ${idx+1}] Standard: ${chunk.standard_code} | Clause: ${chunk.clause}\n${chunk.content}\n\n`
    sources.push({ standard: chunk.standard_code, clause: chunk.clause })
  })

  const rulesSection = appliedRules ? `\n[ADMIN OVERRIDE RULES - APPLY THESE EXACTLY]:\n${appliedRules}\n` : ""

  let systemPrompt = "";
  if (standard_filter === '🌐 GENERAL AI') {
      systemPrompt = `You are a highly capable AI Assistant for Oil & Gas Inspection Engineers.
You are currently in 'General AI' mode. You do NOT need to restrict your answers to a specific database context.
Answer the user's question using your vast internal knowledge.
Provide structured, well-formatted, and helpful answers.

IMPORTANT RULE: The inspector asking the question is in the field and in a rush. ALWAYS provide a **Direct Answer** (1-2 sentences maximum) at the very top. 
Below that, provide a detailed **Explanation** section with more context if needed. If they specify they want a long answer, you may provide more detail.

If question is in Arabic, answer in Arabic.
${rulesSection}`
  } else {
      systemPrompt = `You are an expert oil and gas inspection engineer with deep knowledge of welding, NDT, and piping standards. 
Answer ONLY from the provided standard clauses below. 

You MUST start your response with EXACTLY this structured format:
**Standard:** [Standard Code & Name]
**Edition:** [Edition if available, else Latest]
**Clause:** [Clause Number]

**Direct Answer:**
[Provide a very concise, 1-2 sentence bottom-line answer here. Assume the inspector is in the field and in a rush.]

**Explanation:**
[Provide the detailed explanation, context, and exact code quotes here for full understanding.]

If the answer is not in the context, say: 'This specific clause is not in my loaded standards.'
Never guess. Never fabricate clause numbers.
If question is in Arabic, answer in Arabic (except for the structured headers).
${rulesSection}
CONTEXT SOURCES:
${contextText}
`
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history || []),
    { role: "user", content: question }
  ]
  
  return { messages, sources, today }
}

app.post('/api/ask', async (c) => {
  try {
    const { question, language, session_id, standard_filter, history } = await c.req.json()
    
    if (!question || !session_id) return c.json({ error: 'Missing fields' }, 400)
    
    let contextData
    try {
      contextData = await prepareContextAndMessages(c, question, language, session_id, standard_filter, history)
    } catch(e) {
      if (e.message === 'RATE_LIMIT') return c.json({ error: 'Limit reached' }, 429)
      throw e
    }
    
    const { messages, sources, today } = contextData
    const { response, model, provider } = await askAIProvider(c, messages, false)
    
    const json = await response.json()
    let answer = "Error connecting to AI model.";
      let finishReason = "stop";
      if (json && json.choices && json.choices.length > 0) {
          answer = json.choices[0].message.content || "Empty response.";
          finishReason = json.choices[0].finish_reason || "stop";
      } else {
          console.error("OpenRouter Error:", JSON.stringify(json));
          answer = `OpenRouter Error: ${json.error?.message || JSON.stringify(json)}`;
      }
    
    // Log usage
    await c.env.DB.prepare(
      `INSERT INTO usage_log (session_id, question, model_used, date) VALUES (?, ?, ?, ?)`
    ).bind(session_id, question, model, today).run()
    
    return c.json({ answer, finish_reason: finishReason, sources, model_used: model })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/ask/stream', async (c) => {
  try {
    const { question, language, session_id, standard_filter, history } = await c.req.json()
    
    if (!question || !session_id) return c.json({ error: 'Missing fields' }, 400)
    
    let contextData
    try {
      contextData = await prepareContextAndMessages(c, question, language, session_id, standard_filter, history)
    } catch(e) {
      if (e.message === 'RATE_LIMIT') return c.json({ error: 'Limit reached' }, 429)
      throw e
    }
    
    const { messages, sources, today } = contextData
    const { response, model, provider } = await askAIProvider(c, messages, true)
    
    // We send sources and model as initial event then stream chunks
    const stream = new ReadableStream({
      async start(controller) {
        // Send meta event
        const meta = JSON.stringify({ sources, model_used: model })
        controller.enqueue(new TextEncoder().encode(`event: meta\ndata: ${meta}\n\n`))
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          controller.enqueue(new TextEncoder().encode(chunk))
        }
        controller.close()
        
        // Log usage
        await c.env.DB.prepare(
          `INSERT INTO usage_log (session_id, question, model_used, date) VALUES (?, ?, ?, ?)`
        ).bind(session_id, question, model, today).run()
      }
    })
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

export default app
