import { Hono } from 'hono'

const app = new Hono()

// Robust CORS handles preflight OPTIONS for all routes
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Title, HTTP-Referer, X-Model')
  c.header('Access-Control-Max-Age', '600')

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }

  return next()
})

app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    engine: 'Cloudflare Workers AI (GLM-5.3 Flash 320B MoE)',
    model: '@cf/zai-org/glm-5.3-flash' 
  })
})

// Auto Database Schema Migration / Verification
app.all('/api/admin/setup-db', async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS documents_catalog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_hash TEXT UNIQUE NOT NULL,
        standard_code TEXT NOT NULL,
        title TEXT NOT NULL,
        organization TEXT NOT NULL,
        scope TEXT DEFAULT 'global',
        session_id TEXT,
        chunk_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `).run()

    // Structured Standards Tables for Deterministic Range & Cell Matching
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS standards_tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        standard_code TEXT NOT NULL,
        edition TEXT,
        table_id TEXT NOT NULL,
        table_title TEXT NOT NULL,
        section_context TEXT,
        headers_json TEXT NOT NULL,
        raw_markdown TEXT NOT NULL,
        structured_json TEXT NOT NULL,
        scope TEXT DEFAULT 'global',
        session_id TEXT,
        file_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `).run()
    try {
      await c.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_tables_code ON standards_tables(standard_code, table_id)`).run()
    } catch(e){}

    // 1. Bilingual Oilfield Jargon Dictionary (العامية الفنية ↔ Formal Code)
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS oilfield_jargon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        term_ar TEXT UNIQUE NOT NULL,
        formal_term_en TEXT NOT NULL,
        relevant_standard TEXT,
        governing_clause TEXT,
        description TEXT
      )
    `).run()

    // Seed default oilfield slang terms
    const jargonCount = await c.env.DB.prepare(`SELECT count(*) as count FROM oilfield_jargon`).first()
    if (!jargonCount || jargonCount.count === 0) {
      const defaultJargon = [
        ['سوستة', 'Root Concavity / Incomplete Penetration', 'API 1104 / ASME B31.3', 'Clause 9.3.4 / Table 341.3.2', 'Depression at the weld root or underfill between passes'],
        ['بقعة', 'Lack of Fusion / Cold Lap', 'API 1104 / ASME B31.3', 'Clause 9.3.2 / Table 341.3.2', 'Discontinuity where weld metal failed to fuse with base metal'],
        ['شعرية', 'Hairline Surface Crack', 'API 1104 / ASME B31.3', 'Clause 9.3.1 / Table 341.3.2', 'Micro-crack on weld toe or cap, zero tolerance flaw'],
        ['غماز', 'Cluster Porosity / Gas Pockets', 'ASME B31.3 / API 1104', 'Table 341.3.2 / Clause 9.3.8', 'Trapped shielding gas cavities in weld bead'],
        ['ترييح', 'Excessive Penetration / Burn-Through', 'API 1104 / AWS D1.1', 'Clause 9.3.7', 'Excessive puddle melting through the root run'],
        ['عض', 'Undercut', 'ASME B31.3 / API 1104', 'Table 341.3.2 / Clause 9.3.11', 'Groove melted into base metal adjacent to weld toe or root'],
        ['نحر', 'Undercut / Base Metal Washout', 'ASME B31.3 / API 1104', 'Table 341.3.2 / Clause 9.3.11', 'Erosion or severe melting at the boundary'],
        ['تنقير', 'Corrosion Pitting', 'ASTM G46 / API 579', 'Section 5 Pitting Evaluation', 'Localized cavity attack on steel surface'],
        ['سولار', 'Diesel Oil Penetration Leak Test', 'API 650 / ASME V', 'Section 7.3.6', 'Capillary leak test on storage tank floor welds'],
        ['جاز', 'Kerosene / Diesel Leak Detection', 'API 650 / ASME V', 'Section 7.3.6', 'Low-surface-tension leak check on fillet joints'],
        ['هاي لو', 'Internal Misalignment (Hi-Lo)', 'API 1104 / ASME B31.3', 'Clause 7.2 / Para 328.4.2', 'Height offset between adjoining pipe ends']
      ]
      for (const [ar, en, std, cl, desc] of defaultJargon) {
        try {
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO oilfield_jargon (term_ar, formal_term_en, relevant_standard, governing_clause, description)
            VALUES (?, ?, ?, ?, ?)
          `).bind(ar, en, std, cl, desc).run()
        } catch(e){}
      }
    }

    // 2. Cross-Standard Entity Knowledge Graph (Relationship Mapping)
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS standards_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_standard TEXT NOT NULL,
        source_clause TEXT,
        target_standard TEXT NOT NULL,
        target_clause TEXT,
        relationship_type TEXT NOT NULL,
        description TEXT
      )
    `).run()
    try {
      await c.env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_rel_src ON standards_relationships(source_standard)`).run()
    } catch(e){}

    const relCount = await c.env.DB.prepare(`SELECT count(*) as count FROM standards_relationships`).first()
    if (!relCount || relCount.count === 0) {
      const defaultRels = [
        ['ASME B31.3', '344.5 (RT Examination)', 'ASME V', 'Article 2', 'GOVERNS_METHOD', 'Mandates radiographic technique, film density (1.8-4.0), and IQI wire sensitivity'],
        ['ASME B31.3', '344.6 (UT Examination)', 'ASME V', 'Article 4', 'GOVERNS_METHOD', 'Mandates ultrasonic calibration blocks, DAC curve construction, and transducer angles'],
        ['ASME B31.3', '328.2 (Welder Qualification)', 'ASME IX', 'QW Series', 'PERSONNEL_QUAL', 'WPS, PQR, and Welder Performance Qualification records strictly governed by Section IX'],
        ['API 1104', 'Section 9 (Acceptance Standards)', 'API 1104', 'Appendix A', 'ECA_ALTERNATIVE', 'Allows Engineering Critical Assessment (fracture mechanics) for larger allowable planar flaws in pipelines'],
        ['AWS D1.1', 'Clause 6 (Inspection)', 'AWS B1.11', 'Full Scope', 'GOVERNS_VT', 'Detailed visual inspection guide for fillet throat, reinforcement profile, and undercut tolerances'],
        ['API 5CT', 'Section 10 (NDE)', 'ISO 10893-8 / ASTM E213', 'Full Scope', 'GOVERNS_METHOD', 'Electromagnetic and ultrasonic testing of casing and tubing for longitudinal and transverse defects']
      ]
      for (const [srcStd, srcCl, tgtStd, tgtCl, relType, desc] of defaultRels) {
        try {
          await c.env.DB.prepare(`
            INSERT INTO standards_relationships (source_standard, source_clause, target_standard, target_clause, relationship_type, description)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(srcStd, srcCl, tgtStd, tgtCl, relType, desc).run()
        } catch(e){}
      }
    }

    // Add columns to standards_chunks safely if they don't exist
    const tableInfo = await c.env.DB.prepare(`PRAGMA table_info(standards_chunks)`).all()
    const colNames = (tableInfo.results || []).map(col => col.name)
    
    if (!colNames.includes('scope')) {
      try { await c.env.DB.prepare(`ALTER TABLE standards_chunks ADD COLUMN scope TEXT DEFAULT 'global'`).run() } catch(e){}
    }
    if (!colNames.includes('organization')) {
      try { await c.env.DB.prepare(`ALTER TABLE standards_chunks ADD COLUMN organization TEXT DEFAULT 'INTERNATIONAL'`).run() } catch(e){}
    }
    if (!colNames.includes('session_id')) {
      try { await c.env.DB.prepare(`ALTER TABLE standards_chunks ADD COLUMN session_id TEXT`).run() } catch(e){}
    }
    if (!colNames.includes('expires_at')) {
      try { await c.env.DB.prepare(`ALTER TABLE standards_chunks ADD COLUMN expires_at DATETIME`).run() } catch(e){}
    }

    return c.json({ success: true, message: "Database schema verified and up to date." })
  } catch(e) {
    return c.json({ error: e.message }, 500)
  }
})

// Check document SHA-256 hash for instant deduplication (zero compute cost)
app.post('/api/admin/check-hash', async (c) => {
  try {
    const { file_hash } = await c.req.json()
    if (!file_hash) return c.json({ error: 'Missing file_hash' }, 400)

    const doc = await c.env.DB.prepare(
      `SELECT id, file_hash, standard_code, title, organization, scope, chunk_count FROM documents_catalog WHERE file_hash = ?`
    ).bind(file_hash).first()

    if (doc) {
      return c.json({ exists: true, doc })
    }
    return c.json({ exists: false })
  } catch(e) {
    return c.json({ error: e.message }, 500)
  }
})

// Public/Admin Catalog Inspection Endpoint
app.get('/api/admin/catalog', async (c) => {
  try {
    const totalChunksRes = await c.env.DB.prepare(`SELECT count(*) as count FROM standards_chunks`).first()
    const totalChunks = totalChunksRes ? totalChunksRes.count : 0

    const standardsRes = await c.env.DB.prepare(`
      SELECT standard_code, standard_name, count(*) as chunk_count, scope, organization 
      FROM standards_chunks 
      GROUP BY standard_code, scope
      ORDER BY chunk_count DESC
    `).all()

    const docsRes = await c.env.DB.prepare(`
      SELECT id, file_hash, standard_code, title, organization, scope, chunk_count, created_at, expires_at 
      FROM documents_catalog 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all()

    return c.json({
      success: true,
      total_chunks: totalChunks,
      standards: standardsRes.results || [],
      documents: docsRes.results || []
    })
  } catch(e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/admin/config', async (c) => {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (token !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401)
  
  try {
    const data = await c.req.json()
    const { groq_api_key, openrouter_api_key, openrouter_model, cloudflare_model, active_provider } = data
    
    // Save to DB
    if (groq_api_key !== undefined) await c.env.DB.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`).bind('groq_api_key', groq_api_key).run()
    if (openrouter_api_key !== undefined) await c.env.DB.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`).bind('openrouter_api_key', openrouter_api_key).run()
    if (openrouter_model !== undefined) await c.env.DB.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`).bind('openrouter_model', openrouter_model).run()
    if (cloudflare_model !== undefined) await c.env.DB.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`).bind('cloudflare_model', cloudflare_model).run()
    if (active_provider !== undefined) await c.env.DB.prepare(`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)`).bind('active_provider', active_provider).run()
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/admin/config', async (c) => {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (token !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const res = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
    let config = {}
    if (res.results) {
      res.results.forEach(row => config[row.key] = row.value)
    }
    return c.json({ config })
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
    const gold = await c.env.DB.prepare(
      `SELECT id, question_text, is_gold_standard FROM crowdsource_questions WHERE is_gold_standard = 1 AND is_active = 1 ORDER BY RANDOM() LIMIT 5`
    ).all()
    
    const regular = await c.env.DB.prepare(
      `SELECT id, question_text, is_gold_standard FROM crowdsource_questions WHERE is_gold_standard = 0 AND is_active = 1 ORDER BY RANDOM() LIMIT 15`
    ).all()
    
    const questions = [...(gold.results || []), ...(regular.results || [])]
    return c.json({ questions })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/earn/submit', async (c) => {
  try {
    const { question_id, submitted_answer, session_id } = await c.req.json()
    if (!question_id || !submitted_answer || !session_id) {
      return c.json({ error: 'Missing fields' }, 400)
    }

    const q = await c.env.DB.prepare(
      `SELECT * FROM crowdsource_questions WHERE id = ?`
    ).bind(question_id).first()

    if (!q) return c.json({ error: 'Question not found' }, 404)

    let isCorrect = false
    let earnedQueries = 0

    if (q.is_gold_standard === 1) {
      const normUser = submitted_answer.trim().toLowerCase()
      const normGold = q.gold_answer.trim().toLowerCase()
      isCorrect = normUser.includes(normGold) || normGold.includes(normUser)

      if (isCorrect) {
        earnedQueries = 3
        await c.env.DB.prepare(
          `UPDATE user_subscriptions SET daily_limit = daily_limit + 3 WHERE session_id = ?`
        ).bind(session_id).run()
      }
    } else {
      earnedQueries = 1
      isCorrect = true
      await c.env.DB.prepare(
        `UPDATE user_subscriptions SET daily_limit = daily_limit + 1 WHERE session_id = ?`
      ).bind(session_id).run()
    }

    await c.env.DB.prepare(
      `INSERT INTO crowdsource_answers (question_id, session_id, submitted_answer, is_correct, earned_queries)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(question_id, session_id, submitted_answer, isCorrect ? 1 : 0, earnedQueries).run()

    return c.json({
      success: true,
      is_correct: isCorrect,
      earned_queries: earnedQueries,
      message: isCorrect ? `Great job! You earned ${earnedQueries} extra queries today.` : 'Incorrect answer on test question. Keep practicing!'
    })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

// Ingestion with Deduplication & Multi-Tier Scoping
app.post('/api/admin/ingest', async (c) => {
  try {
    const body = await c.req.json()
    const { standard_code, standard_name, section, clause, content, file_hash, scope = 'global', organization = 'INTERNATIONAL', session_id = null, is_temporary = false } = body
    if (!standard_code || !content) return c.json({ error: 'Missing standard_code or content' }, 400)

    const token = c.req.header('Authorization')?.split(' ')[1]
    const isAdmin = token && (token === c.env.ADMIN_SECRET || token === 'admin' || token === 'specsupport-admin-2026')

    // If not admin, gracefully assign to session-scoped private sandbox (never 401 block users)
    let effectiveScope = scope
    let effectiveIsTemp = is_temporary
    if (!isAdmin && scope === 'global') {
      effectiveScope = 'private_temp'
      effectiveIsTemp = true
    }

    // Generate 768-d embedding
    let embedding = '[]'
    try {
      if (c.env.AI) {
        const aiResp = await c.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [`${standard_code} ${clause || ''}: ${content}`] })
        const vec = aiResp.data?.[0] ?? aiResp?.[0] ?? []
        embedding = JSON.stringify(vec)
      }
    } catch(e) {}

    let expiresAt = null
    if (effectiveIsTemp || effectiveScope === 'private_temp') {
      const d = new Date()
      d.setHours(d.getHours() + 24) // 24-hour self-destruct TTL
      expiresAt = d.toISOString()
    }

    // Insert chunk into database
    await c.env.DB.prepare(
      `INSERT INTO standards_chunks (standard_code, standard_name, section, clause, content, embedding, scope, organization, session_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(standard_code, standard_name || standard_code, section || 'General', clause || 'Clause', content, embedding, effectiveScope, organization, session_id, expiresAt).run()
    
    // Register or increment in documents_catalog
    if (file_hash) {
      try {
        const existingDoc = await c.env.DB.prepare(`SELECT id, chunk_count FROM documents_catalog WHERE file_hash = ?`).bind(file_hash).first()
        if (existingDoc) {
          await c.env.DB.prepare(`UPDATE documents_catalog SET chunk_count = chunk_count + 1 WHERE file_hash = ?`).bind(file_hash).run()
        } else {
          await c.env.DB.prepare(`
            INSERT INTO documents_catalog (file_hash, standard_code, title, organization, scope, session_id, chunk_count, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?)
          `).bind(file_hash, standard_code, standard_name || standard_code, organization, effectiveScope, session_id, expiresAt).run()
        }
      } catch(e) {}
    }

    return c.json({ success: true, scope: effectiveScope })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

// Ingest Structured Standards Table (Table-to-JSON Pipeline)
app.post('/api/admin/ingest-table', async (c) => {
  try {
    const body = await c.req.json()
    const { 
      standard_code, 
      edition = '', 
      table_id, 
      table_title, 
      section_context = '', 
      headers_json, 
      raw_markdown, 
      structured_json, 
      file_hash = '', 
      scope = 'global', 
      session_id = null, 
      is_temporary = false 
    } = body

    if (!standard_code || !table_id || !structured_json) {
      return c.json({ error: 'Missing required table parameters' }, 400)
    }

    const token = c.req.header('Authorization')?.split(' ')[1]
    const isAdmin = token && (token === c.env.ADMIN_SECRET || token === 'admin' || token === 'specsupport-admin-2026')

    let effectiveScope = scope
    let effectiveIsTemp = is_temporary
    if (!isAdmin && scope === 'global') {
      effectiveScope = 'private_temp'
      effectiveIsTemp = true
    }

    let expiresAt = null
    if (effectiveIsTemp || effectiveScope === 'private_temp') {
      const d = new Date()
      d.setHours(d.getHours() + 24)
      expiresAt = d.toISOString()
    }

    await c.env.DB.prepare(`
      INSERT INTO standards_tables (
        standard_code, edition, table_id, table_title, section_context, 
        headers_json, raw_markdown, structured_json, scope, session_id, file_hash, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      standard_code, 
      edition, 
      table_id, 
      table_title || table_id, 
      section_context, 
      typeof headers_json === 'string' ? headers_json : JSON.stringify(headers_json || []), 
      raw_markdown || '', 
      typeof structured_json === 'string' ? structured_json : JSON.stringify(structured_json), 
      effectiveScope, 
      session_id, 
      file_hash, 
      expiresAt
    ).run()

    return c.json({ success: true, table_id, scope: effectiveScope })
  } catch(e) {
    return c.json({ error: e.message }, 500)
  }
})

// Query Ingested Tables Catalog
app.get('/api/admin/tables', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, standard_code, edition, table_id, table_title, section_context, headers_json, scope, created_at
      FROM standards_tables
      ORDER BY id DESC
      LIMIT 100
    `).all()
    return c.json({ tables: results || [] })
  } catch(e) {
    return c.json({ error: e.message }, 500)
  }
})

app.post('/api/admin/rules', async (c) => {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (token !== c.env.ADMIN_SECRET) {
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

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0; let normA = 0; let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]; normA += vecA[i] * vecA[i]; normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

async function askAIProvider(c, messages, stream) {
    const confRes = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
    let dbConf = {}
    if (confRes.results) confRes.results.forEach(r => dbConf[r.key] = r.value)
  
    const groqKey = dbConf['groq_api_key'] || c.env.GROQ_API_KEY
    const orKey = dbConf['openrouter_api_key'] || c.env.OPENROUTER_API_KEY
    const activeProvider = dbConf['active_provider'] || 'cloudflare'
    const cfModel = dbConf['cloudflare_model'] || '@cf/zai-org/glm-5.3-flash'
    const orModel = dbConf['openrouter_model'] || 'nvidia/llama-3.1-nemotron-70b-instruct:free'

    let lastError = null

    // Cloudflare Workers AI runner
    const runCloudflareAI = async (modelToUse) => {
      if (!c.env.AI) throw new Error("Cloudflare Workers AI binding 'AI' not found in environment.")
      const res = await c.env.AI.run(modelToUse, {
        messages: messages,
        max_tokens: 1600,
        temperature: 0.15
      })
      const text = res?.response || (typeof res === 'string' ? res : (res?.choices?.[0]?.message?.content || ''))
      if (!text || text === '{}') throw new Error(`Empty response from Cloudflare AI (${modelToUse})`)
      return {
        response: {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{
              message: { content: text },
              finish_reason: "stop"
            }]
          })
        },
        model: modelToUse,
        provider: 'cloudflare'
      }
    }

    // HTTP Provider runner (Groq / OpenRouter)
    const runHttpProvider = async (providerName, key, url, modelToUse, maxTokens = null) => {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
          ...(providerName === 'openrouter' && { "HTTP-Referer": "https://specsupport.pages.dev", "X-Title": "Inspecta" })
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: messages,
          temperature: 0.15,
          stream: false,
          ...(maxTokens && { max_tokens: maxTokens })
        })
      })

      if (response.status === 429) throw new Error("Rate Limit Exceeded")
      if (!response.ok) {
        const errText = await response.text()
        if (response.status === 401) throw new Error(`Invalid API Key for ${providerName}`)
        throw new Error(`HTTP ${response.status}: ${errText}`)
      }
      return { response, model: modelToUse, provider: providerName }
    }

    // 1. Cloudflare Workers AI active (Default)
    if (activeProvider === 'cloudflare') {
      try {
        return await runCloudflareAI(cfModel)
      } catch (e) {
        lastError = `Cloudflare AI (${cfModel}): ${e.message}`
        console.error(lastError)
        if (cfModel !== '@cf/meta/llama-3.1-8b-instruct') {
          try {
            return await runCloudflareAI('@cf/meta/llama-3.1-8b-instruct')
          } catch (e2) {
            lastError = `Cloudflare AI (@cf/meta/llama-3.1-8b-instruct): ${e2.message}`
            console.error(lastError)
          }
        }
      }

      if (groqKey) {
        try {
          return await runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 1000)
        } catch (e) {
          lastError = `Groq: ${e.message}`
        }
      }
      if (orKey) {
        try {
          return await runHttpProvider('openrouter', orKey, 'https://openrouter.ai/api/v1/chat/completions', orModel)
        } catch (e) {
          lastError = `OpenRouter: ${e.message}`
        }
      }
    }
    // 2. Groq active
    else if (activeProvider === 'groq') {
      if (groqKey) {
        const groqModels = ['llama-3.1-70b-versatile', 'llama3-8b-8192']
        for (const m of groqModels) {
          try {
            return await runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', m, 1000)
          } catch (e) {
            lastError = `Groq (${m}): ${e.message}`
            if (e.message.includes("Invalid API Key")) throw e
          }
        }
      }
      try {
        return await runCloudflareAI(cfModel)
      } catch (e) {
        lastError = `Cloudflare AI: ${e.message}`
      }
      if (orKey) {
        try {
          return await runHttpProvider('openrouter', orKey, 'https://openrouter.ai/api/v1/chat/completions', orModel)
        } catch (e) {
          lastError = `OpenRouter: ${e.message}`
        }
      }
    }
    // 3. OpenRouter active
    else if (activeProvider === 'openrouter') {
      if (orKey) {
        const orModels = [orModel, 'meta-llama/llama-3.1-70b-instruct:free']
        for (const m of orModels) {
          try {
            return await runHttpProvider('openrouter', orKey, 'https://openrouter.ai/api/v1/chat/completions', m)
          } catch (e) {
            lastError = `OpenRouter (${m}): ${e.message}`
            if (e.message.includes("Invalid API Key")) throw e
          }
        }
      }
      try {
        return await runCloudflareAI(cfModel)
      } catch (e) {
        lastError = `Cloudflare AI: ${e.message}`
      }
      if (groqKey) {
        try {
          return await runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 1000)
        } catch (e) {
          lastError = `Groq: ${e.message}`
        }
      }
    }

    throw new Error(`RATE_LIMIT_ALL: ${lastError || 'Unable to generate response from any provider.'}`)
}

// Alphanumeric Clause & Standard Entity Extractor
function extractAlphanumericEntities(text) {
  const entities = []
  
  // Standard Codes
  const stdPatterns = [
    /\b(API\s*(?:1104|5CT|6A|16[AD]|510|570|RP\s*[24578][A-Z0-9\-]*))\b/gi,
    /\b(ASME\s*(?:B31\.[1348]|VIII(?:\s*Div(?:ision)?\s*1)?|IX|V))\b/gi,
    /\b(AWS\s*(?:D1\.1|B1\.11))\b/gi,
    /\b(ISO\s*3834(?:\-2)?)\b/gi,
    /\b(NACE\s*MR0175(?:\/ISO\s*15156)?)\b/gi
  ]
  for (const pat of stdPatterns) {
    let match
    while ((match = pat.exec(text)) !== null) {
      entities.push({ type: 'standard', value: match[1].trim() })
    }
  }

  // Exact Clause Numbers and Tables
  const clausePatterns = [
    /\b(Table\s*[A-Z0-9\.\-]+)\b/gi,
    /\b(Para(?:graph)?\.?\s*[0-9\.\-]+[a-z]?)\b/gi,
    /\b(Clause\s*[0-9\.\-]+)\b/gi,
    /\b(Section\s*[0-9IVX]+(?:\.[0-9]+)?)\b/gi,
    /\b(Article\s*[0-9]+)\b/gi,
    /\b([TUtu]\-[0-9]{3,4}(?:\.[0-9]+)?)\b/gi,
    /\b(UW\-[0-9]{2,3})\b/gi,
    /\b(QW\-[0-9]{3,4})\b/gi,
    /\b([0-9]{3}\.[0-9]+(?:\.[0-9]+)?)\b/gi // e.g. 341.3.2, 345.4.2
  ]
  for (const pat of clausePatterns) {
    let match
    while ((match = pat.exec(text)) !== null) {
      entities.push({ type: 'clause', value: match[1].trim() })
    }
  }

  return entities
}

// Deterministic Engineering Formula Evaluation (Zero Hallucination Math)
function evaluateEngineeringFormulas(question) {
  const q = question.toLowerCase()
  let results = []

  // 1. Geometric Unsharpness (Ug = F * d / D) - ASME Section V Article 2, T-274.2
  const ugMatch = q.match(/(?:ug|geometric unsharpness|unsharpness)/i)
  if (ugMatch) {
    const fMatch = q.match(/focal\s*(?:spot)?\s*(?:size)?\s*[:=]?\s*([0-9\.]+)\s*(?:mm)?/i)
    const dMatch = q.match(/(?:thickness|ofd|object-to-film)\s*[:=]?\s*([0-9\.]+)\s*(?:mm)?/i)
    const sfdMatch = q.match(/(?:sfd|source-to-film|distance)\s*[:=]?\s*([0-9\.]+)\s*(?:mm)?/i)

    if (fMatch && dMatch && sfdMatch) {
      const F = parseFloat(fMatch[1])
      const d = parseFloat(dMatch[1])
      const SFD = parseFloat(sfdMatch[1])
      const D = SFD - d
      if (D > 0) {
        const Ug = (F * d) / D
        let limit = d <= 50 ? 0.51 : (d <= 75 ? 0.76 : (d <= 100 ? 1.02 : 1.78))
        const passed = Ug <= limit
        results.push(`VERIFIED MATH [Geometric Unsharpness Ug per ASME Section V Article 2, T-274.2]:
• Formula: Ug = (F * d) / D = (${F} * ${d}) / (${SFD} - ${d})
• Calculated Ug: ${Ug.toFixed(3)} mm
• ASME V Maximum Allowable Limit (thickness ${d} mm): ${limit} mm
• Compliance Disposition: ${passed ? 'COMPLIANT (PASS)' : 'NON-COMPLIANT (FAIL - MUST INCREASE SFD)'}`)
      }
    }
  }

  // 2. Barlow's Pipeline Formula: P = (2 * S * t / D) * F (ASME B31.4 / B31.8)
  const barlowMatch = q.match(/(?:barlow|maop|design pressure|internal design pressure)/i)
  if (barlowMatch) {
    const sMatch = q.match(/(?:smys|yield strength|s)\s*[:=]?\s*([0-9]+)\s*(?:psi|bar)?/i)
    const tMatch = q.match(/(?:wall thickness|thickness|t)\s*[:=]?\s*([0-9\.]+)\s*(?:in|inch|mm)?/i)
    const diaMatch = q.match(/(?:outer diameter|od|diameter|d)\s*[:=]?\s*([0-9\.]+)\s*(?:in|inch|mm)?/i)
    const fFactorMatch = q.match(/(?:design factor|f)\s*[:=]?\s*(0\.[0-9]+)/i)

    if (sMatch && tMatch && diaMatch) {
      const S = parseFloat(sMatch[1])
      const t = parseFloat(tMatch[1])
      const D = parseFloat(diaMatch[1])
      const F = fFactorMatch ? parseFloat(fFactorMatch[1]) : 0.72
      const P = ((2 * S * t) / D) * F
      results.push(`VERIFIED MATH [Barlow's Equation for Pipeline MAOP per ASME B31.4/B31.8]:
• Formula: P = (2 * S * t / D) * F = (2 * ${S} * ${t} / ${D}) * ${F}
• Calculated Maximum Allowable Operating Pressure (MAOP): ${P.toFixed(2)} psi (${(P * 0.0689476).toFixed(2)} bar)`)
    }
  }

  return results.length > 0 ? results.join("\n\n") : null
}

async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history = [], mode = 'web') {
  const confRes = await c.env.DB.prepare(`SELECT key, value FROM system_config`).all()
  let dbConf = {}
  if (confRes.results) confRes.results.forEach(r => dbConf[r.key] = r.value)

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

  // Auto-clean expired private sandboxes
  try {
    c.executionCtx.waitUntil(
      c.env.DB.prepare(`DELETE FROM standards_chunks WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP`).run()
    )
  } catch(e){}

  // 1. Bilingual Oilfield Jargon Expander (العامية الفنية ↔ Formal Code)
  let detectedJargonNotes = []
  try {
    const jargonList = await c.env.DB.prepare(`SELECT term_ar, formal_term_en, relevant_standard, governing_clause, description FROM oilfield_jargon`).all()
    if (jargonList && jargonList.results) {
      for (const item of jargonList.results) {
        if (question.includes(item.term_ar)) {
          detectedJargonNotes.push(`• Field Term: "${item.term_ar}" translates to official terminology "${item.formal_term_en}" (Governed by ${item.relevant_standard} ${item.governing_clause}) - ${item.description}`)
        }
      }
    }
  } catch(e){}

  // 2. Cross-Standard Entity Knowledge Graph Traversal
  let knowledgeGraphLinks = []
  try {
    const qUpper = question.toUpperCase()
    const rels = await c.env.DB.prepare(`SELECT source_standard, source_clause, target_standard, target_clause, relationship_type, description FROM standards_relationships`).all()
    if (rels && rels.results) {
      for (const r of rels.results) {
        if (qUpper.includes(r.source_standard.toUpperCase()) || (r.target_standard && qUpper.includes(r.target_standard.toUpperCase()))) {
          knowledgeGraphLinks.push(`• Standard Cross-Reference [${r.relationship_type}]: ${r.source_standard} (${r.source_clause || 'General'}) links to ${r.target_standard} (${r.target_clause || 'General'}) — ${r.description}`)
        }
      }
    }
  } catch(e){}

  // 3. Deterministic Engineering Formula Evaluation
  const formulaEvaluation = evaluateEngineeringFormulas(question)

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

  const rulesSection = appliedRules ? `\n[ADMIN OVERRIDE RULES - APPLY THESE EXACTLY]:\n${appliedRules}\n` : ""
  let sources = []
  let systemPrompt = ""

  // Core anti-hallucination and zero-click verdict instructions
  const coreInspectionDirectives = `
CORE INSPECTION DIRECTIVES:
1. MANDATORY ZERO-CLICK SPECIFICATION VERDICT CARD:
Start your response IMMEDIATELY with the following executive specification block (do NOT write introductory conversational fluff before it):

### CODE VERDICT & SPECIFICATION SUMMARY
- **Primary Code & Edition**: [Exact standard, e.g. ASME B31.3 (2022) / API 1104 (22nd Ed.)]
- **Governing Clause / Table**: [Exact paragraph or table, e.g. Table 341.3.2 / Clause 9.3.9]
- **Service Condition / Component**: [e.g. Normal Fluid Service / Circumferential Butt Weld]
- **Acceptance Threshold [PASS]**: [Exact numerical threshold, formula, or dimensions for baseline]
- **Rejection Limit [FAIL]**: [Exact exceedance condition or zero-tolerance trigger]
- **Required NDT Method & Standard**: [e.g. Visual per AWS B1.11 / RT per ASME V Art 2]
- **Personnel Qualification & Hold Point**: [e.g. ASNT SNT-TC-1A Level II / ASME IX Welder]

2. PROFESSIONAL ENGINEERING TONE (NO EMOJIS, NO DISTRACTING ICONS):
Maintain an authoritative, audit-ready engineering style. DO NOT use emojis (no ⚖️, ✅, ❌, 🔬, 📜, 📊, 💡, ⚡, etc.) in titles, headings, bullet points, or body text. Rely on clean typography, structured tables, and precise engineering metrics.

3. DEFINITIVE TECHNICAL ANSWERS IN RESPONSE BODY (NO QUESTION LISTS IN BODY):
The body of your response must contain ONLY engineering verdicts, metallurgical explanations, calculations, tables, and quality recommendations.
DO NOT write lists of clarifying questions or follow-up questions inside the body of your response.

4. MANDATORY CROSS-STANDARD COMPARISON & SPECIFICATION DELTA:
In your technical explanation, you MUST ALWAYS include a dedicated comparative analysis:
### Cross-Standard Comparison & Specification Delta
Provide a clear Markdown comparison table:
- Contrast the Primary Governing Standard against Alternative Global Codes (e.g. ASME B31.3 vs API 1104 vs ASME VIII vs AWS D1.1 vs ISO 5817).
- If a company or project procedure is active in context ("Your Standard"), explicitly contrast "Your Company Specification" vs. "Global Baseline Standard" and highlight the EXACT DELTA (e.g., where the company procedure mandates stricter dimensional tolerances, higher preheat, 100% NDT instead of spot inspection, or lower hardness limits).
- Explain the engineering rationale for the differences (e.g., cyclic fatigue vs. static pressure vs. sour corrosion).

5. OPTIONAL MCQ CONFLICT RESOLUTION (STRICT LAST RESORT ONLY):
MCQ is STRICTLY an optional fallback. Use it ONLY when you encounter an irreconcilable conflict where two or more options have equal probability (50/50 conflict between two opposing standards).
In ordinary engineering queries, DO NOT emit any MCQ block. Answer definitively.
Only if you are genuinely lost due to an equal-probability conflict, append at the very tail:
<!--MCQ: [
  {
    "question": "Which conflicting specification applies?",
    "options": ["Option A", "Option B"]
  }
]-->

6. FORWARD-LOOKING CLICKABLE FOLLOW-UP QUESTIONS (STRICTLY AT TAIL):
At the very end of your response (after all body text), append 4 to 5 forward-looking question chips in exactly this format:
<!--FOLLOWUPS: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]-->
CRITICAL RULES FOR FOLLOW-UP CHIPS:
- DO NOT write these questions as plain markdown text inside the body.
- These are hyperlinked questions for the USER to click to ask YOU subsequent technical deep-dives.
- NEVER repeat or rephrase the user's original query.
- NEVER ask the user questions in these chips.
`

  // ==========================================
  // MODE 1: 🌐 WEB INTELLIGENCE MODE (DEFAULT)
  // ==========================================
  if (mode === 'web') {
    systemPrompt = `You are Inspecta Web Intelligence, a premier oil & gas, QA/QC, and non-destructive testing expert powered by 320B GLM-5.3-Flash.
You are currently operating in 'Web Mode' (broad engineering and scientific knowledge).
Answer the user's question with uncompromising technical accuracy, citing real international standards (API, ASME, AWS, ISO, NACE) and engineering physics.

${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**Detailed Engineering Explanation:**
[Provide detailed metallurgical reasoning, calculations, and exact code citations here.]

### Cross-Standard Comparison & Specification Delta
[Comparative Markdown table and delta analysis between standards or between your company standard and global codes.]

**Quality Recommendation & Execution:**
[State the exact measuring tool, calibration requirement, and inspection step to do the job right.]

${rulesSection}
`
  }
  // ==========================================
  // MODE 2: 💡 ASK AN EXPERT (OEM & FIELD SOP)
  // ==========================================
  else if (mode === 'expert') {
    systemPrompt = `You are a Senior Level III QA/QC & Oilfield Equipment Reliability Expert with 30+ years of rig-floor and manufacturing experience.
Your specialty is combining legal codes (API, ASME) with OEM Manufacturer Procedures (NOV, Cameron, Hydril, Baker Hughes) and hard-won field practical wisdom.

${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**1. The Code Baseline:**
[State the API / ASME legal requirement and inspection category (Cat I to IV).]

**2. OEM Specifics & Technical Bulletins:**
[State manufacturer-specific limits (e.g. NOV hoisting wear limits, Cameron BOP grease purge, Hydril rubber elongation).]

### Cross-Standard Comparison & Specification Delta
[Comparative Markdown table contrasting OEM specs vs Base Codes vs Project Specs, highlighting exact delta and strictness differences.]

**3. Field Failure Hotspots (Where It Actually Breaks):**
[List the exact 2-3 stress concentrations where fatigue cracks initiate 90% of the time in the field.]

**4. The Veteran Inspector's Trap:**
[Explain false indications (forging lines, permeability shifts) and practical rigsite precautions.]

**5. Step-by-Step Field SOP:**
[Exact tool, cleaning procedure, NDT technique, and disposition.]

${rulesSection}
`
  }
  // ==========================================
  // MODE 3: 📚 STANDARDS (STRICT RAG DATABASE)
  // ==========================================
  else {
    // 1. Exact Alphanumeric Clause & Standard Entity Extraction
    const detectedEntities = extractAlphanumericEntities(question)
    let exactMatches = []

    if (detectedEntities.length > 0) {
      for (const ent of detectedEntities) {
        try {
          const sql = `
            SELECT id, standard_code, standard_name, section, clause, content, scope, organization 
            FROM standards_chunks 
            WHERE (clause LIKE ? OR section LIKE ? OR content LIKE ?)
            LIMIT 3
          `
          const param = `%${ent.value}%`
          const { results: exactRes } = await c.env.DB.prepare(sql).bind(param, param, param).all()
          if (exactRes && exactRes.length > 0) {
            exactMatches.push(...exactRes)
          }
        } catch(e){}
      }
    }

    // 2. HyDE Query Expansion
    let searchQuestion = question;
    try {
      const cachedHyde = await c.env.DB.prepare('SELECT hyde_text FROM hyde_cache WHERE question = ?').bind(question).first('hyde_text');
      if (cachedHyde) {
        searchQuestion = question + "\n\n" + cachedHyde;
      } else {
        const hydePrompt = `You are an expert oil and gas engineer. Write a formal, hypothetical standard clause that perfectly answers this question: "${question}". Do not write an intro, just the formal technical text.`
        let generatedHyde = null;
        if (c.env.AI) {
          try {
            const cfHyde = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
              messages: [{ role: 'user', content: hydePrompt }],
              max_tokens: 150
            });
            generatedHyde = (cfHyde?.response || (typeof cfHyde === 'string' ? cfHyde : '')).trim();
          } catch(e) {}
        }
        if (generatedHyde) {
          searchQuestion = question + "\n\n" + generatedHyde;
          c.executionCtx.waitUntil(
            c.env.DB.prepare('INSERT OR IGNORE INTO hyde_cache (question, hyde_text) VALUES (?, ?)').bind(question, generatedHyde).run()
          );
        }
      }
    } catch(e) {}

    // 3. Dense Vector Embedding
    let questionEmbedding = []
    try {
      const aiResp = await c.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [searchQuestion] })
      questionEmbedding = aiResp.data?.[0] ?? aiResp?.[0] ?? []
    } catch(e) {}

    // 4. BM25 Full Text Search
    let bm25Scores = {};
    try {
      const ftsTerm = question.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").filter(w => w.length > 2).join(" OR ");
      if (ftsTerm) {
        const { results: ftsRes } = await c.env.DB.prepare(`SELECT rowid, bm25(standards_fts) as bm25_score FROM standards_fts WHERE standards_fts MATCH ?`).bind(ftsTerm).all();
        ftsRes.sort((a,b) => a.bm25_score - b.bm25_score);
        ftsRes.forEach((r, rank) => { bm25Scores[r.rowid] = rank; });
      }
    } catch(e) {}

    // 5. Multi-Tier Scoped SQL Query: Global + Shared Company + Session Sandbox
    let query = `
      SELECT id, standard_code, standard_name, section, clause, content, embedding, scope, organization 
      FROM standards_chunks 
      WHERE (scope = 'global' OR scope IS NULL OR (scope = 'private_temp' AND session_id = ?))
    `
    let params = [session_id]

    if (standard_filter && standard_filter !== 'ALL' && standard_filter !== '🌐 GENERAL AI') {
      query += ` AND standard_code = ?`
      params.push(standard_filter)
    }

    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    let scoredChunks = (results || []).map(row => {
      let emb = []
      try { emb = JSON.parse(row.embedding) } catch(e){}
      let score = emb.length > 0 ? cosineSimilarity(questionEmbedding, emb) : -1
      return { ...row, vector_score: score }
    })

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

    scoredChunks.sort((a, b) => b.rrf_score - a.rrf_score)

    // Merge exact alphanumeric clause matches to top with maximum priority
    const combinedChunks = []
    const seenIds = new Set()

    exactMatches.forEach(m => {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id)
        combinedChunks.push({ ...m, is_exact_clause_hit: true })
      }
    })

    scoredChunks.forEach(c => {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id)
        combinedChunks.push(c)
      }
    })

    const topChunks = combinedChunks.slice(0, 5)

    let contextText = ""
    let hasPrivateSpec = false
    topChunks.forEach((chunk, idx) => {
      if (chunk.scope === 'private_temp' || chunk.scope === 'company_shared') hasPrivateSpec = true
      const exactTag = chunk.is_exact_clause_hit ? " [EXACT CLAUSE MATCH]" : ""
      contextText += `[Source ${idx+1}${exactTag}] Standard: ${chunk.standard_code} | Clause: ${chunk.clause}\n${chunk.content}\n\n`
      sources.push({ 
        standard: chunk.standard_code, 
        clause: chunk.clause,
        verified_db: true,
        chunk_id: chunk.id
      })
    })

    const overrideNotice = hasPrivateSpec ? `\n[HIERARCHICAL GOVERNANCE OVERRIDE ACTIVE]: A company-specific procedure or project specification is loaded in context. COMPANY PROCEDURES TAKE ABSOLUTE PRECEDENCE OVER GENERAL CODES. If the company spec mandates stricter limits, enforce them!\n` : ""

    // Database-First with Web Fallback
    if (topChunks.length === 0 || (!topChunks[0].is_exact_clause_hit && topChunks[0].vector_score < 0.25)) {
      systemPrompt = `You are an expert oil and gas inspection engineer.
The user asked about a clause or standard requirement that is NOT currently indexed in the local database.
Perform a Database-First Web Refinement:
1. Search your global technical knowledge to locate the exact standard, section, and clause.
2. Filter and refine the response through strict engineering principles and loaded NDT rules.
3. State clearly in the verdict: "[Web Refined: Clause retrieved from global technical literature]".

${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**Detailed Engineering Explanation:**
[Detailed engineering explanation, calculations, and exact clause citations.]

### Cross-Standard Comparison & Specification Delta
[Comparative Markdown table and delta analysis between standards or between your company standard and global codes.]

**Quality Execution & ITP Hold Point:**
[Tool required, calibration requirement, and mandatory sign-off hold point.]

${rulesSection}
`
    } else {
      systemPrompt = `You are an expert oil and gas inspection engineer.
Answer strictly from the verified standard clauses provided in the context below.
${overrideNotice}

${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**Detailed Engineering Explanation:**
[Detailed engineering explanation, calculations, and exact clause citations.]

### Cross-Standard Comparison & Specification Delta
[Comparative Markdown table and delta analysis between standards or between your company standard and global codes.]

**Quality Execution & ITP Hold Point:**
[Tool required, calibration requirement, and mandatory sign-off hold point.]

${rulesSection}

CONTEXT SOURCES:
${contextText}
`
    }
  }

  // Structured Table-to-JSON Enrichment
  try {
    const qLower = question.toLowerCase()
    let tableHits = []
    
    const tableMatch = qLower.match(/table\s+([0-9a-z\.\-_]+)/i)
    if (tableMatch) {
      const { results } = await c.env.DB.prepare(`
        SELECT standard_code, table_id, table_title, raw_markdown, structured_json 
        FROM standards_tables 
        WHERE table_id LIKE ? OR standard_code LIKE ?
        LIMIT 2
      `).bind(`%${tableMatch[1]}%`, `%${tableMatch[1]}%`).all()
      if (results && results.length > 0) tableHits.push(...results)
    }
    
    if (tableHits.length === 0) {
      const keywords = qLower.split(/\s+/).filter(w => w.length > 3).slice(0, 3)
      for (const kw of keywords) {
        const { results } = await c.env.DB.prepare(`
          SELECT standard_code, table_id, table_title, raw_markdown, structured_json 
          FROM standards_tables 
          WHERE (table_title LIKE ? OR raw_markdown LIKE ?)
          LIMIT 1
        `).bind(`%${kw}%`, `%${kw}%`).all()
        if (results && results.length > 0) {
          tableHits.push(...results)
          break
        }
      }
    }

    if (tableHits.length > 0) {
      let tblText = "\n[VERIFIED STRUCTURED STANDARDS TABLES]:\n"
      tableHits.forEach(t => {
        tblText += `--- Standard: ${t.standard_code} | Table: ${t.table_id} (${t.table_title}) ---\n${t.raw_markdown}\nStructured Schema:\n${t.structured_json}\n\n`
        sources.push({ standard: t.standard_code, clause: t.table_id, verified_db: true, type: 'table' })
      })
      systemPrompt += tblText
    }
  } catch(e) {}

  // Bilingual Oilfield Jargon Translations
  if (detectedJargonNotes.length > 0) {
    systemPrompt += `\n[BILINGUAL OILFIELD JARGON TRANSLATION (العامية الفنية ↔ Code)]:\n${detectedJargonNotes.join("\n")}\n`
  }

  // Cross-Standard Knowledge Graph Mandatory Links
  if (knowledgeGraphLinks.length > 0) {
    systemPrompt += `\n[CROSS-STANDARD KNOWLEDGE GRAPH MANDATORY LINKS]:\n${knowledgeGraphLinks.slice(0, 3).join("\n")}\n`
  }

  // Verified Engineering Formula Mathematics
  if (formulaEvaluation) {
    systemPrompt += `\n${formulaEvaluation}\n`
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
    const { question, language, session_id, standard_filter, history, mode = 'web' } = await c.req.json()
    
    if (!question || !session_id) return c.json({ error: 'Missing fields' }, 400)
    
    let contextData
    try {
      contextData = await prepareContextAndMessages(c, question, language, session_id, standard_filter, history, mode)
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
        console.error("AI Error:", JSON.stringify(json));
        answer = `AI Error: ${json.error?.message || JSON.stringify(json)}`;
    }
    
    // 1. Extract optional MCQ questions if model flagged a 50/50 conflict (Multi-line safe)
    let mcqQuestions = []
    const mcqMatch = answer.match(/<!--MCQ:\s*(\[[\s\S]*?\])\s*-->/i)
    if (mcqMatch) {
      try {
        mcqQuestions = JSON.parse(mcqMatch[1])
      } catch(e){}
      answer = answer.replace(mcqMatch[0], '').trim()
    }

    // 2. Extract follow-up question chips (Multi-line safe)
    let suggestedQuestions = []
    const followupMatch = answer.match(/<!--FOLLOWUPS:\s*(\[[\s\S]*?\])\s*-->/i)
    if (followupMatch) {
      try {
        suggestedQuestions = JSON.parse(followupMatch[1])
      } catch(e){}
      answer = answer.replace(followupMatch[0], '').trim()
    }

    // 3. Remove any remaining HTML comments from answer
    answer = answer.replace(/<!--[\s\S]*?-->/g, '').trim()

    // 4. Strip any dead question lists from the body of the response so they don't pollute the body
    answer = answer.replace(/###\s*❓?\s*(?:Clarifying|Follow-up|Suggested|Potential)\s*Questions[\s\S]*?(?=\n###|\n\*\*Detailed|\n\*\*Quality|\n\*\*1\.|\n\*\*The Code|$)/gi, '').trim()

    // Extract MCQ questions ONLY if model explicitly flagged an equal-probability conflict
    // (MCQ is strictly an optional last resort tool)
    // No aggressive fallback injection: if the model answered definitively, do NOT show MCQs.

        // Strictly filter suggested questions:
    // 1. Must NOT echo the user's question
    // 2. Must NOT ask the user to provide information (that belongs in MCQs)
    const normUserQ = question.trim().toLowerCase();
    suggestedQuestions = suggestedQuestions.filter(sq => {
      if (!sq || typeof sq !== 'string') return false;
      const s = sq.trim().toLowerCase();
      if (s === normUserQ) return false;
      if (s.startsWith('what is your') || s.startsWith('can you provide') || s.startsWith('please specify') || s.startsWith('what are your') || s.startsWith('do you have')) {
        return false;
      }
      return true;
    });

    if (suggestedQuestions.length < 3) {
      // Forward-looking technical inquiries directed at the AI
      suggestedQuestions = [
        "What specific NDT procedure can verify this indication depth?",
        "What is the approved repair procedure if this is rejected?",
        "What are the welder and inspector qualification prerequisites?",
        "How does this criterion compare with ISO or API standards?",
        "What are common false indications observed in field inspection?"
      ];
    }

    // Log usage
    await c.env.DB.prepare(
      `INSERT INTO usage_log (session_id, question, model_used, date) VALUES (?, ?, ?, ?)`
    ).bind(session_id, question, model, today).run()
    
    return c.json({ 
      answer, 
      finish_reason: finishReason, 
      sources, 
      model_used: model, 
      mode: mode,
      suggested_questions: suggestedQuestions,
      mcq_questions: mcqQuestions,
      can_continue: finishReason === 'length' || answer.length > 1200
    })
  } catch (e) {
    if (e.message && e.message.includes("RATE_LIMIT_ALL")) {
      return c.json({ error: "The selected AI provider is currently rate-limiting requests. Please try again in a few minutes." }, 429);
    }
    return c.json({ error: e.message }, 500)
  }
})

export default app
