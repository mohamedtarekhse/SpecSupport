const fs = require('fs');

const workerPath = 'worker/src/index.js';
let content = fs.readFileSync(workerPath, 'utf8');

// Build the updated worker with:
// 1. Exact alphanumeric clause & standard extraction in D1
// 2. Strict Anti-Assumption rule (max 3 clarifying questions)
// 3. Zero-Click Verdict Card format
// 4. Multi-Code Comparison Matrix for ambiguous first prompts
// 5. 5 Dynamic Follow-up Question chips

const updatedWorker = `import { Hono } from 'hono'

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
    await c.env.DB.prepare(\`
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
    \`).run()

    // Add columns to standards_chunks safely if they don't exist
    const tableInfo = await c.env.DB.prepare(\`PRAGMA table_info(standards_chunks)\`).all()
    const colNames = (tableInfo.results || []).map(col => col.name)
    
    if (!colNames.includes('scope')) {
      try { await c.env.DB.prepare(\`ALTER TABLE standards_chunks ADD COLUMN scope TEXT DEFAULT 'global'\`).run() } catch(e){}
    }
    if (!colNames.includes('organization')) {
      try { await c.env.DB.prepare(\`ALTER TABLE standards_chunks ADD COLUMN organization TEXT DEFAULT 'INTERNATIONAL'\`).run() } catch(e){}
    }
    if (!colNames.includes('session_id')) {
      try { await c.env.DB.prepare(\`ALTER TABLE standards_chunks ADD COLUMN session_id TEXT\`).run() } catch(e){}
    }
    if (!colNames.includes('expires_at')) {
      try { await c.env.DB.prepare(\`ALTER TABLE standards_chunks ADD COLUMN expires_at DATETIME\`).run() } catch(e){}
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
      \`SELECT id, file_hash, standard_code, title, organization, scope, chunk_count FROM documents_catalog WHERE file_hash = ?\`
    ).bind(file_hash).first()

    if (doc) {
      return c.json({ exists: true, doc })
    }
    return c.json({ exists: false })
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
    if (groq_api_key !== undefined) await c.env.DB.prepare(\`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)\`).bind('groq_api_key', groq_api_key).run()
    if (openrouter_api_key !== undefined) await c.env.DB.prepare(\`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)\`).bind('openrouter_api_key', openrouter_api_key).run()
    if (openrouter_model !== undefined) await c.env.DB.prepare(\`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)\`).bind('openrouter_model', openrouter_model).run()
    if (cloudflare_model !== undefined) await c.env.DB.prepare(\`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)\`).bind('cloudflare_model', cloudflare_model).run()
    if (active_provider !== undefined) await c.env.DB.prepare(\`INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)\`).bind('active_provider', active_provider).run()
    
    return c.json({ success: true })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/admin/config', async (c) => {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (token !== c.env.ADMIN_SECRET) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const res = await c.env.DB.prepare(\`SELECT key, value FROM system_config\`).all()
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
      \`SELECT count(*) as count FROM usage_log WHERE session_id = ? AND date = ?\`
    ).bind(session_id, today).first()
    
    const count = usageRes ? usageRes.count : 0
    
    const subRes = await c.env.DB.prepare(
      \`SELECT daily_limit FROM user_subscriptions WHERE session_id = ?\`
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
      \`SELECT id, question_text, is_gold_standard FROM crowdsource_questions WHERE is_gold_standard = 1 AND is_active = 1 ORDER BY RANDOM() LIMIT 5\`
    ).all()
    
    const regular = await c.env.DB.prepare(
      \`SELECT id, question_text, is_gold_standard FROM crowdsource_questions WHERE is_gold_standard = 0 AND is_active = 1 ORDER BY RANDOM() LIMIT 15\`
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
      \`SELECT * FROM crowdsource_questions WHERE id = ?\`
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
          \`UPDATE user_subscriptions SET daily_limit = daily_limit + 3 WHERE session_id = ?\`
        ).bind(session_id).run()
      }
    } else {
      earnedQueries = 1
      isCorrect = true
      await c.env.DB.prepare(
        \`UPDATE user_subscriptions SET daily_limit = daily_limit + 1 WHERE session_id = ?\`
      ).bind(session_id).run()
    }

    await c.env.DB.prepare(
      \`INSERT INTO crowdsource_answers (question_id, session_id, submitted_answer, is_correct, earned_queries)
       VALUES (?, ?, ?, ?, ?)\`
    ).bind(question_id, session_id, submitted_answer, isCorrect ? 1 : 0, earnedQueries).run()

    return c.json({
      success: true,
      is_correct: isCorrect,
      earned_queries: earnedQueries,
      message: isCorrect ? \`Great job! You earned \${earnedQueries} extra queries today.\` : 'Incorrect answer on test question. Keep practicing!'
    })
  } catch (e) {
    return c.json({ error: e.message }, 500)
  }
})

// Ingestion with Deduplication & Multi-Tier Scoping
app.post('/api/admin/ingest', async (c) => {
  const token = c.req.header('Authorization')?.split(' ')[1]
  if (token !== c.env.ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { standard_code, standard_name, section, clause, content, file_hash, scope = 'global', organization = 'INTERNATIONAL', session_id = null, is_temporary = false } = await c.req.json()
    if (!standard_code || !content) return c.json({ error: 'Missing standard_code or content' }, 400)

    // Generate 768-d embedding
    let embedding = '[]'
    try {
      if (c.env.AI) {
        const aiResp = await c.env.AI.run('@cf/baai/bge-small-en-v1.5', { text: [\`\${standard_code} \${clause || ''}: \${content}\`] })
        const vec = aiResp.data?.[0] ?? aiResp?.[0] ?? []
        embedding = JSON.stringify(vec)
      }
    } catch(e) {}

    let expiresAt = null
    if (is_temporary || scope === 'private_temp') {
      const d = new Date()
      d.setHours(d.getHours() + 24) // 24-hour self-destruct TTL
      expiresAt = d.toISOString()
    }

    // Insert chunk into database
    await c.env.DB.prepare(
      \`INSERT INTO standards_chunks (standard_code, standard_name, section, clause, content, embedding, scope, organization, session_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`
    ).bind(standard_code, standard_name, section, clause, content, embedding, scope, organization, session_id, expiresAt).run()
    
    // Register in documents_catalog if hash supplied and chunk 1
    if (file_hash && (section === 'Page 1' || clause.includes('Chunk 1'))) {
      try {
        await c.env.DB.prepare(\`
          INSERT OR REPLACE INTO documents_catalog (file_hash, standard_code, title, organization, scope, session_id, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        \`).bind(file_hash, standard_code, standard_name, organization, scope, session_id, expiresAt).run()
      } catch(e) {}
    }

    return c.json({ success: true })
  } catch (e) {
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
      \`INSERT INTO ndt_rules (keyword, instruction) VALUES (?, ?)\`
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
    const confRes = await c.env.DB.prepare(\`SELECT key, value FROM system_config\`).all()
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
      if (!text || text === '{}') throw new Error(\`Empty response from Cloudflare AI (\${modelToUse})\`)
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
          "Authorization": \`Bearer \${key}\`,
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
        if (response.status === 401) throw new Error(\`Invalid API Key for \${providerName}\`)
        throw new Error(\`HTTP \${response.status}: \${errText}\`)
      }
      return { response, model: modelToUse, provider: providerName }
    }

    // 1. Cloudflare Workers AI active (Default)
    if (activeProvider === 'cloudflare') {
      try {
        return await runCloudflareAI(cfModel)
      } catch (e) {
        lastError = \`Cloudflare AI (\${cfModel}): \${e.message}\`
        console.error(lastError)
        if (cfModel !== '@cf/meta/llama-3.1-8b-instruct') {
          try {
            return await runCloudflareAI('@cf/meta/llama-3.1-8b-instruct')
          } catch (e2) {
            lastError = \`Cloudflare AI (@cf/meta/llama-3.1-8b-instruct): \${e2.message}\`
            console.error(lastError)
          }
        }
      }

      if (groqKey) {
        try {
          return await runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 1000)
        } catch (e) {
          lastError = \`Groq: \${e.message}\`
        }
      }
      if (orKey) {
        try {
          return await runHttpProvider('openrouter', orKey, 'https://openrouter.ai/api/v1/chat/completions', orModel)
        } catch (e) {
          lastError = \`OpenRouter: \${e.message}\`
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
            lastError = \`Groq (\${m}): \${e.message}\`
            if (e.message.includes("Invalid API Key")) throw e
          }
        }
      }
      try {
        return await runCloudflareAI(cfModel)
      } catch (e) {
        lastError = \`Cloudflare AI: \${e.message}\`
      }
      if (orKey) {
        try {
          return await runHttpProvider('openrouter', orKey, 'https://openrouter.ai/api/v1/chat/completions', orModel)
        } catch (e) {
          lastError = \`OpenRouter: \${e.message}\`
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
            lastError = \`OpenRouter (\${m}): \${e.message}\`
            if (e.message.includes("Invalid API Key")) throw e
          }
        }
      }
      try {
        return await runCloudflareAI(cfModel)
      } catch (e) {
        lastError = \`Cloudflare AI: \${e.message}\`
      }
      if (groqKey) {
        try {
          return await runHttpProvider('groq', groqKey, 'https://api.groq.com/openai/v1/chat/completions', 'llama-3.1-70b-versatile', 1000)
        } catch (e) {
          lastError = \`Groq: \${e.message}\`
        }
      }
    }

    throw new Error(\`RATE_LIMIT_ALL: \${lastError || 'Unable to generate response from any provider.'}\`)
}

// Alphanumeric Clause & Standard Entity Extractor
function extractAlphanumericEntities(text) {
  const entities = []
  
  // Standard Codes
  const stdPatterns = [
    /\\b(API\\s*(?:1104|5CT|6A|16[AD]|510|570|RP\\s*[24578][A-Z0-9\\-]*))\\b/gi,
    /\\b(ASME\\s*(?:B31\\.[1348]|VIII(?:\\s*Div(?:ision)?\\s*1)?|IX|V))\\b/gi,
    /\\b(AWS\\s*(?:D1\\.1|B1\\.11))\\b/gi,
    /\\b(ISO\\s*3834(?:\\-2)?)\\b/gi,
    /\\b(NACE\\s*MR0175(?:\\/ISO\\s*15156)?)\\b/gi
  ]
  for (const pat of stdPatterns) {
    let match
    while ((match = pat.exec(text)) !== null) {
      entities.push({ type: 'standard', value: match[1].trim() })
    }
  }

  // Exact Clause Numbers and Tables
  const clausePatterns = [
    /\\b(Table\\s*[A-Z0-9\\.\\-]+)\\b/gi,
    /\\b(Para(?:graph)?\\.?\\s*[0-9\\.\\-]+[a-z]?)\\b/gi,
    /\\b(Clause\\s*[0-9\\.\\-]+)\\b/gi,
    /\\b(Section\\s*[0-9IVX]+(?:\\.[0-9]+)?)\\b/gi,
    /\\b(Article\\s*[0-9]+)\\b/gi,
    /\\b([TUtu]\\-[0-9]{3,4}(?:\\.[0-9]+)?)\\b/gi,
    /\\b(UW\\-[0-9]{2,3})\\b/gi,
    /\\b(QW\\-[0-9]{3,4})\\b/gi,
    /\\b([0-9]{3}\\.[0-9]+(?:\\.[0-9]+)?)\\b/gi // e.g. 341.3.2, 345.4.2
  ]
  for (const pat of clausePatterns) {
    let match
    while ((match = pat.exec(text)) !== null) {
      entities.push({ type: 'clause', value: match[1].trim() })
    }
  }

  return entities
}

async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history = [], mode = 'web') {
  const confRes = await c.env.DB.prepare(\`SELECT key, value FROM system_config\`).all()
  let dbConf = {}
  if (confRes.results) confRes.results.forEach(r => dbConf[r.key] = r.value)

  // Usage check
  const today = new Date().toISOString().split('T')[0]
  if (session_id !== 'admin') {
    const usageRes = await c.env.DB.prepare(
      \`SELECT count(*) as count FROM usage_log WHERE session_id = ? AND date = ?\`
    ).bind(session_id, today).first()
    
    const count = usageRes ? usageRes.count : 0
    
    const subRes = await c.env.DB.prepare(
      \`SELECT daily_limit FROM user_subscriptions WHERE session_id = ?\`
    ).bind(session_id).first()
    
    const limit = subRes ? subRes.daily_limit : 9999
    
    if (count >= limit) {
      throw new Error('RATE_LIMIT')
    }
  }

  // Auto-clean expired private sandboxes
  try {
    c.executionCtx.waitUntil(
      c.env.DB.prepare(\`DELETE FROM standards_chunks WHERE expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP\`).run()
    )
  } catch(e){}

  // Fetch active dynamic context rules
  const rulesRes = await c.env.DB.prepare(\`SELECT keyword, instruction FROM ndt_rules WHERE is_active = 1\`).all()
  let appliedRules = ""
  if (rulesRes.results) {
    const qLower = question.toLowerCase()
    for (const rule of rulesRes.results) {
      if (qLower.includes(rule.keyword.toLowerCase())) {
        appliedRules += \`- \${rule.instruction}\\n\`
      }
    }
  }

  const rulesSection = appliedRules ? \`\\n[ADMIN OVERRIDE RULES - APPLY THESE EXACTLY]:\\n\${appliedRules}\\n\` : ""
  let sources = []
  let systemPrompt = ""

  // Core anti-hallucination, strict anti-assumption, and zero-click verdict instructions
  const coreInspectionDirectives = \`
CORE INSPECTION DIRECTIVES:
1. MANDATORY ZERO-CLICK VERDICT CARD:
Start your response IMMEDIATELY with the following high-contrast markdown block (do NOT write introductory conversational fluff before it):

### ⚖️ GOVERNING CODE & CLAUSE VERDICT
- **Primary Code & Edition**: [Exact standard, e.g. ASME B31.3 (2022) / API 1104 (22nd Ed.)]
- **Governing Clause / Table**: [Exact paragraph or table, e.g. Table 341.3.2 / Clause 9.3.9]
- **Service Condition / Component**: [e.g. Normal Fluid Service / Circumferential Butt Weld]
- **✅ Immediate Acceptance Limit**: [Exact numerical threshold, formula, or dimensions]
- **❌ Mandatory Rejection Criteria**: [Exact exceedance condition or zero-tolerance trigger]
- **🔬 Required NDT Method & Standard**: [e.g. Visual per AWS B1.11 / RT per ASME V Art 2]
- **📜 Personnel Qualification**: [e.g. ASNT SNT-TC-1A Level II / ASME IX Welder]

2. STRICT ANTI-ASSUMPTION RULE (DO NOT GUESS MISSING VARIABLES):
In welding and NDT quality inspection, assuming a fluid category, wall thickness, or joint type without verification can cause catastrophic field failures or illegal certifications.
If the user's prompt omits critical parameters (e.g. wall thickness, fluid category, design code, or operating temperature):
- Provide the baseline verdict or multi-code comparison for standard cases.
- Add a clear warning callout: \`> ⚠️ **Missing Inspection Parameters**: [State missing inputs]\`
- You MUST ask a MAXIMUM OF 3 precise, targeted clarifying questions to pinpoint the exact clause (under \`### ❓ Clarifying Questions for Precise Acceptance:\`).

3. MULTI-CODE COMPARISON MATRIX FOR BROAD / AMBIGUOUS QUERIES:
If the user's query is broad or applies across multiple industry sectors (e.g. general questions about "undercut", "porosity", "hydrotest pressure", or "fatigue cracks"), DO NOT assume one code. Provide a **Cross-Sector Comparison Matrix Table** on the first prompt comparing:
- ASME B31.3 (Process Plant Piping)
- API 1104 (Cross-Country Pipelines)
- ASME VIII Div 1 (Pressure Vessels)
- AWS D1.1 (Structural Steel)
- API RP 7G-2 / API 5CT (Drill Stem & Casing if relevant)

4. DYNAMIC FOLLOW-UP QUESTION CHIPS:
At the very end of your response, ALWAYS include 4 to 5 highly relevant, actionable follow-up question chips in exactly this format:
<!--FOLLOWUPS: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]-->
Ensure these chips cover:
1) Measuring tool & calibration required,
2) Disposition upon rejection (grind/repair vs cut-out),
3) Cross-code comparison or alternative NDT method,
4) Personnel qualification or ITP hold point,
5) False indication diagnostic or rig-floor trap.
\`

  // ==========================================
  // MODE 1: 🌐 WEB INTELLIGENCE MODE (DEFAULT)
  // ==========================================
  if (mode === 'web') {
    systemPrompt = \`You are Inspecta Web Intelligence, a premier oil & gas, QA/QC, and non-destructive testing expert powered by 320B GLM-5.3-Flash.
You are currently operating in 'Web Mode' (broad engineering and scientific knowledge).
Answer the user's question with uncompromising technical accuracy, citing real international standards (API, ASME, AWS, ISO, NACE) and engineering physics.

\${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**Detailed Engineering Explanation:**
[Provide detailed metallurgical reasoning, calculations, and exact code citations here.]

**Quality Recommendation & Execution:**
[State the exact measuring tool, calibration requirement, and inspection step to do the job right.]

\${rulesSection}
\`
  }
  // ==========================================
  // MODE 2: 💡 ASK AN EXPERT (OEM & FIELD SOP)
  // ==========================================
  else if (mode === 'expert') {
    systemPrompt = \`You are a Senior Level III QA/QC & Oilfield Equipment Reliability Expert with 30+ years of rig-floor and manufacturing experience.
Your specialty is combining legal codes (API, ASME) with OEM Manufacturer Procedures (NOV, Cameron, Hydril, Baker Hughes) and hard-won field practical wisdom.

\${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**1. The Code Baseline:**
[State the API / ASME legal requirement and inspection category (Cat I to IV).]

**2. OEM Specifics & Technical Bulletins:**
[State manufacturer-specific limits (e.g. NOV hoisting wear limits, Cameron BOP grease purge, Hydril rubber elongation).]

**3. Field Failure Hotspots (Where It Actually Breaks):**
[List the exact 2-3 stress concentrations where fatigue cracks initiate 90% of the time in the field.]

**4. The Veteran Inspector's Trap:**
[Explain false indications (forging lines, permeability shifts) and practical rigsite precautions.]

**5. Step-by-Step Field SOP:**
[Exact tool, cleaning procedure, NDT technique, and disposition.]

\${rulesSection}
\`
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
          const sql = \`
            SELECT id, standard_code, standard_name, section, clause, content, scope, organization 
            FROM standards_chunks 
            WHERE (clause LIKE ? OR section LIKE ? OR content LIKE ?)
            LIMIT 3
          \`
          const param = \`%\${ent.value}%\`
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
        searchQuestion = question + "\\n\\n" + cachedHyde;
      } else {
        const hydePrompt = \`You are an expert oil and gas engineer. Write a formal, hypothetical standard clause that perfectly answers this question: "\${question}". Do not write an intro, just the formal technical text.\`
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
          searchQuestion = question + "\\n\\n" + generatedHyde;
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
        const { results: ftsRes } = await c.env.DB.prepare(\`SELECT rowid, bm25(standards_fts) as bm25_score FROM standards_fts WHERE standards_fts MATCH ?\`).bind(ftsTerm).all();
        ftsRes.sort((a,b) => a.bm25_score - b.bm25_score);
        ftsRes.forEach((r, rank) => { bm25Scores[r.rowid] = rank; });
      }
    } catch(e) {}

    // 5. Multi-Tier Scoped SQL Query: Global + Shared Company + Session Sandbox
    let query = \`
      SELECT id, standard_code, standard_name, section, clause, content, embedding, scope, organization 
      FROM standards_chunks 
      WHERE (scope = 'global' OR scope IS NULL OR (scope = 'private_temp' AND session_id = ?))
    \`
    let params = [session_id]

    if (standard_filter && standard_filter !== 'ALL' && standard_filter !== '🌐 GENERAL AI') {
      query += \` AND standard_code = ?\`
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
      contextText += \`[Source \${idx+1}\${exactTag}] Standard: \${chunk.standard_code} | Clause: \${chunk.clause}\\n\${chunk.content}\\n\\n\`
      sources.push({ 
        standard: chunk.standard_code, 
        clause: chunk.clause,
        verified_db: true,
        chunk_id: chunk.id
      })
    })

    const overrideNotice = hasPrivateSpec ? \`\\n[HIERARCHICAL GOVERNANCE OVERRIDE ACTIVE]: A company-specific procedure or project specification is loaded in context. COMPANY PROCEDURES TAKE ABSOLUTE PRECEDENCE OVER GENERAL CODES. If the company spec mandates stricter limits, enforce them!\\n\` : ""

    // Database-First with Web Fallback
    if (topChunks.length === 0 || (!topChunks[0].is_exact_clause_hit && topChunks[0].vector_score < 0.25)) {
      systemPrompt = \`You are an expert oil and gas inspection engineer.
The user asked about a clause or standard requirement that is NOT currently indexed in the local database.
Perform a Database-First Web Refinement:
1. Search your global technical knowledge to locate the exact standard, section, and clause.
2. Filter and refine the response through strict engineering principles and loaded NDT rules.
3. State clearly in the verdict: "[Web Refined: Clause retrieved from global technical literature]".

\${coreInspectionDirectives}

\${rulesSection}
\`
    } else {
      systemPrompt = \`You are an expert oil and gas inspection engineer.
Answer strictly from the verified standard clauses provided in the context below.
\${overrideNotice}

\${coreInspectionDirectives}

ADDITIONAL STRUCTURE AFTER VERDICT CARD:
**Detailed Engineering Explanation:**
[Detailed engineering explanation, calculations, and exact clause citations.]

**Quality Execution & ITP Hold Point:**
[Tool required, calibration requirement, and mandatory sign-off hold point.]

\${rulesSection}

CONTEXT SOURCES:
\${contextText}
\`
    }
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
        answer = \`AI Error: \${json.error?.message || JSON.stringify(json)}\`;
    }
    
    // Extract follow-up question chips if present
    let suggestedQuestions = []
    const followupMatch = answer.match(/<!--FOLLOWUPS:\\s*(\\[.*?\\])\\s*-->/)
    if (followupMatch) {
      try {
        suggestedQuestions = JSON.parse(followupMatch[1])
        answer = answer.replace(followupMatch[0], '').trim()
      } catch(e){}
    }

    if (suggestedQuestions.length === 0) {
      // High-value 5 dynamic follow-up questions
      suggestedQuestions = [
        "What measuring gauge and calibration is required?",
        "What is the mandatory action upon rejection (repair vs cut-out)?",
        "How does this criterion compare with other international codes?",
        "What are the inspector and welder qualification prerequisites?",
        "What are common false indications in the field?"
      ]
    }

    // Log usage
    await c.env.DB.prepare(
      \`INSERT INTO usage_log (session_id, question, model_used, date) VALUES (?, ?, ?, ?)\`
    ).bind(session_id, question, model, today).run()
    
    return c.json({ 
      answer, 
      finish_reason: finishReason, 
      sources, 
      model_used: model, 
      mode: mode,
      suggested_questions: suggestedQuestions,
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
`;

fs.writeFileSync(workerPath, updatedWorker, 'utf8');
console.log('Successfully updated worker/src/index.js');
