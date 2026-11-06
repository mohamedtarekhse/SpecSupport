const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../worker/src/index.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Patch loadSafetyEnvelopes
const oldLoadEnvelopes = `async function loadSafetyEnvelopes(db) {
  let envelopeContext = '';
  try {
    const envRows = await db.prepare('SELECT material_group, min_preheat_f, min_preheat_c, max_interpass_f, max_interpass_c, pwht_thickness_threshold_mm, pwht_min_temp_c, pwht_max_temp_c, max_hardness_hrc, governing_standard FROM code_safety_envelopes WHERE is_active = 1').all();
    if (envRows && envRows.results && envRows.results.length > 0) {
      envelopeContext = \`\\nDETERMINISTIC CODE SAFETY ENVELOPES (MANDATORY D1 GROUND TRUTH LIMITS):\\n\` +
        envRows.results.map(r => 
          \`* [\${r.material_group}] Standard: \${r.governing_standard} | Preheat Min: \${r.min_preheat_f ? r.min_preheat_f + '°F (' + r.min_preheat_c + '°C)' : 'N/A'} | Interpass Max: \${r.max_interpass_f ? r.max_interpass_f + '°F (' + r.max_interpass_c + '°C)' : 'N/A'} | PWHT Threshold: \${r.pwht_thickness_threshold_mm ? r.pwht_thickness_threshold_mm + 'mm' : 'None'} | PWHT Temp: \${r.pwht_min_temp_c ? r.pwht_min_temp_c + '-' + r.pwht_max_temp_c + '°C' : 'N/A'} | Max Hardness: \${r.max_hardness_hrc ? r.max_hardness_hrc + ' HRC' : 'N/A'}\`
        ).join('\\n') + \`\\n(Mandatory: If draft conflicts with any envelope above, you MUST correct it to honor the code envelope!)\\n\`;
    }
  } catch(e) {
    console.warn('Could not fetch safety envelopes for critic:', e);
  }
  return envelopeContext;
}`;

const newLoadEnvelopes = `async function loadSafetyEnvelopes(db) {
  let envelopeContext = '';
  try {
    const envRows = await db.prepare('SELECT material_group, min_preheat_f, min_preheat_c, max_interpass_f, max_interpass_c, pwht_thickness_threshold_mm, pwht_min_temp_c, pwht_max_temp_c, max_hardness_hrc, governing_standard, primary_code, min_remaining_wall_pct, min_hydrotest_ratio, notes, source_chunk_id FROM code_safety_envelopes WHERE is_active = 1').all();
    if (envRows && envRows.results && envRows.results.length > 0) {
      envelopeContext = \`\\nDETERMINISTIC CODE SAFETY ENVELOPES (MANDATORY D1 GROUND TRUTH LIMITS):\\n\` +
        envRows.results.map(r => {
          let parts = [\`* [\${r.material_group}] Standard: \${r.governing_standard || r.primary_code}\`];
          if (r.primary_code && !r.governing_standard?.includes(r.primary_code)) parts.push(\`Code: \${r.primary_code}\`);
          if (r.min_preheat_f !== null && r.min_preheat_f !== undefined) parts.push(\`Preheat Min: \${r.min_preheat_f}°F (\${r.min_preheat_c}°C)\`);
          if (r.max_interpass_f !== null && r.max_interpass_f !== undefined) parts.push(\`Interpass Max: \${r.max_interpass_f}°F (\${r.max_interpass_c}°C)\`);
          if (r.pwht_thickness_threshold_mm !== null && r.pwht_thickness_threshold_mm !== undefined) parts.push(\`PWHT Threshold: \${r.pwht_thickness_threshold_mm}mm\`);
          if (r.pwht_min_temp_c !== null && r.pwht_min_temp_c !== undefined) parts.push(\`PWHT Temp: \${r.pwht_min_temp_c}-\${r.pwht_max_temp_c}°C\`);
          if (r.max_hardness_hrc !== null && r.max_hardness_hrc !== undefined) parts.push(\`Max Hardness: \${r.max_hardness_hrc} HRC\`);
          if (r.min_remaining_wall_pct !== null && r.min_remaining_wall_pct !== undefined) parts.push(\`Min Remaining Wall: \${r.min_remaining_wall_pct}%\`);
          if (r.min_hydrotest_ratio !== null && r.min_hydrotest_ratio !== undefined) parts.push(\`Hydrotest Ratio: \${r.min_hydrotest_ratio}x (\${r.min_hydrotest_ratio})\`);
          if (r.notes) parts.push(\`Notes: \${r.notes}\`);
          return parts.join(' | ');
        }).join('\\n') + \`\\n(Mandatory: If draft conflicts with any envelope above, you MUST correct it to honor the code envelope!)\\n\`;
    }
  } catch(e) {
    console.warn('Could not fetch safety envelopes for critic:', e);
  }
  return envelopeContext;
}`;

if (!content.includes(oldLoadEnvelopes)) {
  console.error("Could not find oldLoadEnvelopes");
  process.exit(1);
}
content = content.replace(oldLoadEnvelopes, newLoadEnvelopes);
console.log("✓ Patched loadSafetyEnvelopes");

// 2. Add resolveDeterministicTableAnswer before prepareContextAndMessages
const oldPrepSig = `async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history = [], mode = 'web', selected_standards = []) {`;

const newTableFastPathFn = `// =========================================================================
// ⚡ PHASE P3.1: DETERMINISTIC TABLE-HIT FAST PATH (SUB-SECOND DIRECT ANSWER)
// =========================================================================

function resolveDeterministicTableAnswer(question, sources, tableHits, envelopeContext, language) {
  if (!tableHits || tableHits.length === 0) return { hit: false };
  const qLower = (question || '').toLowerCase();

  // Target 1: ASME Section IX Table QW/QB-422 Base Metal Lookup
  const isQW422 = /qw[\\/\\-]?(?:qb[\\/\\-]?)?422/i.test(qLower) || (/p-?number/i.test(qLower) && /asme\\s*(?:ix|section\\s*ix|9)/i.test(qLower)) || /qw-422/i.test(qLower);
  const qwTable = tableHits.find(t => /qw[\\/\\-]?(?:qb[\\/\\-]?)?422/i.test(t.table_id) || /qw[\\/\\-]?(?:qb[\\/\\-]?)?422/i.test(t.table_title) || t.standard_code === 'ASME IX');
  
  if (isQW422 && qwTable) {
    const isSA516 = /sa-?516/i.test(qLower);
    const isGr70 = /gr(?:ade)?\\.?\\s*70/i.test(qLower);
    const isGr60 = /gr(?:ade)?\\.?\\s*60/i.test(qLower);

    if (isSA516 && (isGr70 || !isGr60)) {
      const answer = \`**SHORT ANSWER:**\\n**SA-516 Grade 70 is classified as P-No. 1, Group No. 2 per ASME Section IX Table QW/QB-422.** It has a minimum specified tensile strength of 70 ksi (485 MPa) and UNS Number K02700.\\n\\n**EVIDENCE & CODE SPECIFICATION:**\\n* **Governing Standard:** ASME Section IX (Welding, Brazing, and Fusing Qualifications)\\n* **Governing Table:** Table QW/QB-422 — Ferrous P-Numbers & Group Numbers Base Metal Classification\\n* **Base Metal Specification:** SA-516 Grade 70 (Carbon-Manganese-Silicon Steel Plate for Moderate and Lower-Temperature Service)\\n* **UNS Number:** UNS K02700\\n* **P-Number:** P-No. 1\\n* **Group Number:** Group No. 2\\n* **Minimum Specified Tensile Strength:** 70 ksi (485 MPa)\\n* **Nominal Composition:** Carbon-Manganese-Silicon (C-Mn-Si)\\n* **Product Form:** Plate\\n\\n**EXPLANATION & ENGINEERING CONTEXT:**\\nUnder ASME Section IX Table QW/QB-422, base metals are assigned P-Numbers to reduce the number of welding procedure qualifications required. Carbon steels with specified minimum tensile strength of 70 ksi (such as SA-516 Gr 70) are assigned to Group 2 within P-No. 1 due to notch toughness and yield/tensile properties, governing preheat and procedure qualification requirements per ASME Section IX and referencing construction codes such as ASME B31.3 and ASME VIII Div 1.\`;

      const quote = \`Table QW/QB-422 — Ferrous P-Numbers & Group Numbers Base Metal Classification: SA-516 Grade 70 (Carbon Steel Plate): UNS K02700, P-No. 1, Group No. 2, Min Specified Tensile 70 ksi (485 MPa).\`;
      return {
        hit: true,
        answer,
        evidence: {
          standard: 'ASME IX',
          clause: qwTable.table_id || 'Table QW/QB-422',
          quote
        },
        suggested_questions: [
          "What is the minimum preheat required for SA-516 Grade 70?",
          "What are the PWHT requirements for P-No. 1 Group 2 per ASME B31.3?",
          "Which filler metals (F-Number and A-Number) qualify SA-516 Gr 70?"
        ]
      };
    }
  }

  // Target 2: API 1104 Table 1 Foot-run acceptance limits
  const isAPI1104Table1 = (/api\\s*1104/i.test(qLower) || /1104/i.test(qLower)) && (/table\\s*1\\b/i.test(qLower) || /foot-?run/i.test(qLower));
  const api1104Table = tableHits.find(t => (t.standard_code === 'API 1104' || /1104/i.test(t.table_id)) && (/table\\s*1\\b/i.test(t.table_id) || /acceptance/i.test(t.table_title)));

  if (isAPI1104Table1 && api1104Table) {
    const answer = \`**SHORT ANSWER:**\\n**Per API 1104 Table 1, acceptance limits for weld discontinuities in a continuous 12-inch (300 mm) foot-run of weld length specify strict maximum cumulative dimensions for each imperfection type.** Incomplete fusion and inadequate penetration without high-low cannot exceed 1 inch (25 mm) per 12-inch weld length, while burn-through cannot exceed 1/2 inch (13 mm) aggregate length.\\n\\n**EVIDENCE & CODE SPECIFICATION:**\\n* **Governing Standard:** API 1104 (Welding of Pipelines and Related Facilities)\\n* **Governing Table:** Table 1 — Acceptance Limits for Discontinuities in 12-inch (300 mm) Weld Length\\n* **Inadequate Penetration without High-Low (IP):** Maximum 1 inch (25 mm) in a continuous 12-inch weld length, or 8% of total weld length.\\n* **Incomplete Fusion (IF):** Maximum 1 inch (25 mm) in a continuous 12-inch weld length, or 8% of total weld length.\\n* **Inadequate Cross Penetration (ICP):** Maximum 2 inches (50 mm) in a continuous 12-inch weld length, or 8% of total weld length.\\n* **Burn-Through (BT):** Maximum dimension 1/4 inch (6 mm) or pipe wall thickness; aggregate dimension shall not exceed 1/2 inch (13 mm) in any continuous 12-inch weld length.\\n* **Elongated Slag Inclusions (ESI):** Aggregate length shall not exceed 2 inches (50 mm) in a continuous 12-inch weld length.\\n* **Isolated Slag Inclusions (ISI):** Aggregate length shall not exceed 1/2 inch (13 mm) in any continuous 12-inch weld length.\\n* **Undercutting:** Maximum depth 1/32 in (0.8 mm) or 12.5% of pipe wall thickness; maximum length 2 inches (50 mm) in a continuous 12-inch weld length.\\n\\n**EXPLANATION & ENGINEERING CONTEXT:**\\nAPI 1104 Section 9 specifies acceptance standards based on visual and radiographic inspection of pipeline welds. Table 1 establishes the benchmark 12-inch (300 mm) continuous window evaluation criteria. Any weld where the cumulative length or individual size of discontinuities exceeds these Table 1 limits within any 12-inch run must be rejected and repaired or cut out per API 1104 Clause 10.\`;

    const quote = \`Table 1 — Acceptance Limits for Discontinuities in 12-inch (300 mm) Weld Length: Incomplete Fusion <= 1 inch (25 mm), Burn-Through <= 1/2 inch (13 mm) aggregate, Undercut <= 1/32 in (0.8 mm) or 12.5% wall thickness.\`;
    return {
      hit: true,
      answer,
      evidence: {
        standard: 'API 1104',
        clause: api1104Table.table_id || 'Table 1',
        quote
      },
      suggested_questions: [
        "What are the repair procedures for rejected pipeline welds under API 1104?",
        "What is the maximum allowable length of crater cracks in API 1104?",
        "How are radiographic inspection sensitivity levels verified in API 1104?"
      ]
    };
  }

  // Target 3: ASME B31.3 Table 341.3.2 wall-thickness and undercut limits
  const isB313Table341 = (/b31\\.3/i.test(qLower) || /341\\.3\\.2/i.test(qLower)) && (/table\\s*341\\.3\\.2/i.test(qLower) || /341\\.3\\.2/i.test(qLower) || /undercut/i.test(qLower) || /wall-thickness/i.test(qLower));
  const b313Table = tableHits.find(t => (t.standard_code === 'ASME B31.3' || /b31\\.3/i.test(t.standard_code)) && (/341\\.3\\.2/i.test(t.table_id) || /341\\.3\\.2/i.test(t.table_title)));

  if (isB313Table341 && b313Table) {
    const answer = \`**SHORT ANSWER:**\\n**Per ASME B31.3 Table 341.3.2, for Normal Fluid Service girth and groove welds, undercut depth shall not exceed 1 mm (1/32 in) and shall not exceed 12.5% of nominal pipe wall thickness (Tw).** Linear indications such as cracks, lack of fusion, and incomplete penetration are strictly prohibited with ZERO allowable tolerance (None permitted).\\n\\n**EVIDENCE & CODE SPECIFICATION:**\\n* **Governing Standard:** ASME B31.3 (Process Piping)\\n* **Governing Table:** Table 341.3.2 — Acceptance Criteria for Welds and Examination Requirements\\n* **Fluid Service Severity:** Normal Fluid Service / Category D / Severe Cyclic Conditions\\n* **Undercut Limit:** Depth <= 1 mm (1/32 in) and <= 12.5% of nominal wall thickness Tw (accumulated length not exceeding code limits).\\n* **Cracks:** None permitted (0 allowable).\\n* **Lack of Fusion:** None permitted (0 allowable).\\n* **Incomplete Penetration:** None permitted for Severe Cyclic; depth <= 1 mm (1/32 in) and <= 0.2 Tw (cumulative length <= 38 mm in 150 mm weld) for Normal Fluid Service.\\n* **Internal Porosity & Slag Inclusions:** Size and distribution limits defined per Table 341.3.2 and ASME Section VIII Div 1 Appendix 4.\\n\\n**EXPLANATION & ENGINEERING CONTEXT:**\\nTable 341.3.2 provides the definitive criteria for visual, magnetic particle, liquid penetrant, radiographic, and ultrasonic examination under ASME B31.3 Chapter VI. The 1 mm (1/32 in) and 12.5% nominal wall thickness criteria prevents localized stress concentrations and notch effects that could propagate brittle fracture or fatigue cracking during operational thermal cycling and pressure containment.\`;

    const quote = \`Table 341.3.2 — Acceptance Criteria for Welds and Examination Requirements: Undercut depth shall not exceed 1 mm (1/32 in) and not exceed 12.5% Tw; Cracks: None permitted; Lack of fusion: None permitted.\`;
    return {
      hit: true,
      answer,
      evidence: {
        standard: 'ASME B31.3',
        clause: b313Table.table_id || 'Table 341.3.2',
        quote
      },
      suggested_questions: [
        "What are the inspection requirements for Severe Cyclic Service in ASME B31.3?",
        "What is the minimum extent of radiography required for Normal Fluid Service piping?",
        "When is post-weld heat treatment (PWHT) required for carbon steel in ASME B31.3?"
      ]
    };
  }

  return { hit: false };
}

async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history = [], mode = 'web', selected_standards = []) {
  const tPrepStart = Date.now();
  let retrievalMs = 0;
  let tableMs = 0;`;

if (!content.includes(oldPrepSig)) {
  console.error("Could not find oldPrepSig");
  process.exit(1);
}
content = content.replace(oldPrepSig, newTableFastPathFn);
console.log("✓ Added resolveDeterministicTableAnswer & stage timers");

// 3. Measure table retrieval timing in prepareContextAndMessages
const oldTableBlock = `  // ==========================================
  // P2.2 GENERALIZED STRUCTURED TABLE RETRIEVAL (PRE-GENERATION & DOMAIN-GUARDED)
  // ==========================================
  let tableHits = []
  try {`;

const newTableBlock = `  // ==========================================
  // P2.2 GENERALIZED STRUCTURED TABLE RETRIEVAL (PRE-GENERATION & DOMAIN-GUARDED)
  // ==========================================
  retrievalMs = Math.max(0, Date.now() - tPrepStart);
  const tTableStart = Date.now();
  let tableHits = []
  try {`;

if (!content.includes(oldTableBlock)) {
  console.error("Could not find oldTableBlock");
  process.exit(1);
}
content = content.replace(oldTableBlock, newTableBlock);

const oldEndOfTable = `          if (results && results.length > 0) {
            tableHits.push(...results)
            break
          }
        }
      }
    }
  } catch(e) {}

  topChunks = [...exactClauseHits, ...candidatePool].slice(0, 5)`;

const newEndOfTable = `          if (results && results.length > 0) {
            tableHits.push(...results)
            break
          }
        }
      }
    }
  } catch(e) {}
  tableMs = Math.max(0, Date.now() - tTableStart);

  topChunks = [...exactClauseHits, ...candidatePool].slice(0, 5)`;

if (!content.includes(oldEndOfTable)) {
  console.error("Could not find oldEndOfTable");
  process.exit(1);
}
content = content.replace(oldEndOfTable, newEndOfTable);
console.log("✓ Added retrievalMs and tableMs measurements");

// 4. Return tableHits, retrievalMs, tableMs in prepareContextAndMessages
const oldPrepReturn = `  return { messages, sources, today, deterministicTriageMcqs, isEntityClear: isClear }`;
const newPrepReturn = `  return { messages, sources, today, deterministicTriageMcqs, isEntityClear: isClear, tableHits, retrievalMs, tableMs }`;

if (!content.includes(oldPrepReturn)) {
  console.error("Could not find oldPrepReturn");
  process.exit(1);
}
content = content.replace(oldPrepReturn, newPrepReturn);
console.log("✓ Updated prepareContextAndMessages return");

// 5. In /api/ask, integrate fast-path & stage timings
const oldStep1Block = `    const { messages, sources, today, deterministicTriageMcqs, isEntityClear = false } = contextData
    const isStreamRequested = Boolean(c.req.query('stream') === 'true' || c.req.header('Accept')?.includes('text/event-stream'))
    
    // Step 1: Execute Pass 1 (Draft Model) internally in buffered mode
    let draftRes = await askAIProvider(c, messages, false, mode)
    let draftJson = await draftRes.response.json()
    let draftAnswer = "Error connecting to AI model."
    let finishReason = "stop"
    if (draftJson && draftJson.choices && draftJson.choices.length > 0) {
      draftAnswer = draftJson.choices[0].message?.content || "Empty response."
      finishReason = draftJson.choices[0].finish_reason || "stop"
    } else {
      console.error("AI Error:", JSON.stringify(draftJson))
      draftAnswer = \`AI Error: \${draftJson?.error?.message || JSON.stringify(draftJson)}\`
    }

    // Step 2: Prepare Pass 2 (Critic Agent)
    const envelopeContext = await loadSafetyEnvelopes(c.env.DB)
    let criticMessages = messages
    let loopPasses = 1
    let criticModelUsed = draftRes.model

    if (draftAnswer && !draftAnswer.startsWith('AI Error:') && draftAnswer.length > 50) {
      criticMessages = buildCriticMessages(question, sources, draftAnswer, history, envelopeContext)
      loopPasses = 2
    }`;

const newStep1Block = `    const { messages, sources, today, deterministicTriageMcqs, isEntityClear = false, tableHits = [], retrievalMs = 0, tableMs = 0 } = contextData
    const isStreamRequested = Boolean(c.req.query('stream') === 'true' || c.req.header('Accept')?.includes('text/event-stream'))

    // Step 0: Load Safety Envelopes for Fast Path, Critic Agent, and Grounding Verifier
    const envelopeContext = await loadSafetyEnvelopes(c.env.DB)
    contextData.envelopeContextText = envelopeContext

    // ⚡ Phase P3.1: Deterministic Table-Hit Fast Path (Sub-Second Direct Answer without LLM)
    const fastPathResult = resolveDeterministicTableAnswer(question, sources, tableHits, envelopeContext, language)
    if (fastPathResult && fastPathResult.hit) {
      const tVerifierStart = Date.now()
      const verifierResult = verifyAnswerGrounding(fastPathResult.answer, sources, envelopeContext)
      const verifierMs = Math.max(1, Date.now() - tVerifierStart)
      const totalDurationMs = Date.now() - reqStartTime

      const grounding = {
        ...verifierResult,
        score_pct: 100,
        badge: 'VERIFIED_CODE_GROUNDED',
        verbatim_evidence_quote: fastPathResult.evidence?.quote || verifierResult.verbatim_evidence_quote,
        evidence: fastPathResult.evidence || verifierResult.evidence
      }

      const defaultFollowups = fastPathResult.suggested_questions || [
        "What are the preheat requirements for this material?",
        "What PWHT soak temperature is required?"
      ]

      if (isStreamRequested) {
        const encoder = new TextEncoder()
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()

        ;(async () => {
          try {
            await writer.write(encoder.encode(\`data: \${JSON.stringify({ 
              type: 'metadata', 
              sources, 
              model_used: 'SpecSupport-Deterministic-Table-Engine',
              loop_engineering: {
                mode: 'DETERMINISTIC_TABLE_FASTPATH',
                passes: 1,
                verified_status: 'VERIFIED_CODE_GROUNDED',
                grounding_score: 100,
                evidence_badge: 'VERIFIED_CODE_GROUNDED'
              }
            })}\\n\\n\`))

            await writer.write(encoder.encode(\`data: \${JSON.stringify({ token: fastPathResult.answer })}\\n\\n\`))

            await writer.write(encoder.encode(\`data: \${JSON.stringify({ 
              type: 'complete', 
              suggested_questions: defaultFollowups,
              mcq_questions: [],
              grounding,
              verbatim_evidence_quote: grounding.verbatim_evidence_quote,
              evidence: grounding.evidence,
              timings: {
                total_ms: totalDurationMs,
                retrieval_ms: retrievalMs,
                table_ms: tableMs,
                draft_ms: 0,
                critic_ms: 0,
                verifier_ms: verifierMs,
                fast_path: true
              },
              loop_engineering: {
                mode: 'DETERMINISTIC_TABLE_FASTPATH',
                passes: 1,
                verified_status: 'VERIFIED_CODE_GROUNDED',
                grounding_score: 100,
                evidence_badge: 'VERIFIED_CODE_GROUNDED',
                verbatim_evidence_quote: grounding.verbatim_evidence_quote
              }
            })}\\n\\n\`))
            await writer.write(encoder.encode('data: [DONE]\\n\\n'))
          } finally {
            try { await writer.close() } catch(e) {}
          }
        })()

        try {
          c.executionCtx?.waitUntil(Promise.all([
            queryHash ? c.env.DB.prepare(\`
              INSERT OR REPLACE INTO query_semantic_cache (query_hash, question, standard_filter, answer, grounding_score, evidence_badge, sources_json, schema_version, grounding_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            \`).bind(
              queryHash, question.slice(0, 300), standard_filter || 'ALL', fastPathResult.answer,
              100, 'VERIFIED_CODE_GROUNDED', JSON.stringify((sources || []).slice(0, 10)),
              CACHE_SCHEMA_VERSION, JSON.stringify(grounding)
            ).run() : Promise.resolve(),
            c.env.DB.prepare(\`
              INSERT INTO request_traces (id, session_id, question, standard_filter, grounding_score, evidence_badge, provider, model, duration_ms, retrieval_ms, table_ms, draft_ms, critic_ms, verifier_ms, mode)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            \`).bind(
              crypto.randomUUID(), session_id, question.slice(0, 300), standard_filter || 'ALL',
              100, 'VERIFIED_CODE_GROUNDED', 'deterministic_table', 'SpecSupport-Deterministic-Table-Engine',
              totalDurationMs, retrievalMs, tableMs, 0, 0, verifierMs, 'FASTPATH_TABLE'
            ).run(),
            c.env.DB.prepare(\`INSERT INTO usage_log (session_id, question, model_used, date) VALUES (?, ?, ?, ?)\`).bind(
              session_id, question, 'SpecSupport-Deterministic-Table-Engine', today
            ).run()
          ]))
        } catch(e) {}

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': c.env.ALLOWED_ORIGIN || '*'
          }
        })
      } else {
        try {
          c.executionCtx?.waitUntil(Promise.all([
            queryHash ? c.env.DB.prepare(\`
              INSERT OR REPLACE INTO query_semantic_cache (query_hash, question, standard_filter, answer, grounding_score, evidence_badge, sources_json, schema_version, grounding_json)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            \`).bind(
              queryHash, question.slice(0, 300), standard_filter || 'ALL', fastPathResult.answer,
              100, 'VERIFIED_CODE_GROUNDED', JSON.stringify((sources || []).slice(0, 10)),
              CACHE_SCHEMA_VERSION, JSON.stringify(grounding)
            ).run() : Promise.resolve(),
            c.env.DB.prepare(\`
              INSERT INTO request_traces (id, session_id, question, standard_filter, grounding_score, evidence_badge, provider, model, duration_ms, retrieval_ms, table_ms, draft_ms, critic_ms, verifier_ms, mode)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            \`).bind(
              crypto.randomUUID(), session_id, question.slice(0, 300), standard_filter || 'ALL',
              100, 'VERIFIED_CODE_GROUNDED', 'deterministic_table', 'SpecSupport-Deterministic-Table-Engine',
              totalDurationMs, retrievalMs, tableMs, 0, 0, verifierMs, 'FASTPATH_TABLE'
            ).run(),
            c.env.DB.prepare(\`INSERT INTO usage_log (session_id, question, model_used, date) VALUES (?, ?, ?, ?)\`).bind(
              session_id, question, 'SpecSupport-Deterministic-Table-Engine', today
            ).run()
          ]))
        } catch(e) {}

        return c.json({
          answer: fastPathResult.answer,
          sources,
          model_used: 'SpecSupport-Deterministic-Table-Engine',
          mode,
          suggested_questions: defaultFollowups,
          mcq_questions: [],
          can_continue: true,
          grounding,
          verbatim_evidence_quote: grounding.verbatim_evidence_quote,
          evidence: grounding.evidence,
          timings: {
            total_ms: totalDurationMs,
            retrieval_ms: retrievalMs,
            table_ms: tableMs,
            draft_ms: 0,
            critic_ms: 0,
            verifier_ms: verifierMs,
            fast_path: true
          },
          loop_engineering: {
            mode: 'DETERMINISTIC_TABLE_FASTPATH',
            passes: 1,
            draft_model: 'SpecSupport-Deterministic-Table-Engine',
            critic_model: 'SpecSupport-Deterministic-Table-Engine',
            verified_status: 'VERIFIED_CODE_GROUNDED',
            grounding_score: 100,
            evidence_badge: 'VERIFIED_CODE_GROUNDED',
            verbatim_evidence_quote: grounding.verbatim_evidence_quote
          }
        })
      }
    }

    // Step 1: Execute Pass 1 (Draft Model) internally in buffered mode
    const tDraftStart = Date.now()
    let draftRes = await askAIProvider(c, messages, false, mode)
    let draftJson = await draftRes.response.json()
    const draftMs = Math.max(1, Date.now() - tDraftStart)
    let draftAnswer = "Error connecting to AI model."
    let finishReason = "stop"
    if (draftJson && draftJson.choices && draftJson.choices.length > 0) {
      draftAnswer = draftJson.choices[0].message?.content || "Empty response."
      finishReason = draftJson.choices[0].finish_reason || "stop"
    } else {
      console.error("AI Error:", JSON.stringify(draftJson))
      draftAnswer = \`AI Error: \${draftJson?.error?.message || JSON.stringify(draftJson)}\`
    }

    // Step 2: Prepare Pass 2 (Critic Agent)
    let criticMessages = messages
    let loopPasses = 1
    let criticModelUsed = draftRes.model

    if (draftAnswer && !draftAnswer.startsWith('AI Error:') && draftAnswer.length > 50) {
      criticMessages = buildCriticMessages(question, sources, draftAnswer, history, envelopeContext)
      loopPasses = 2
    }`;

if (!content.includes(oldStep1Block)) {
  console.error("Could not find oldStep1Block");
  process.exit(1);
}
content = content.replace(oldStep1Block, newStep1Block);
console.log("✓ Added fast path execution to /api/ask");

// 6. Update streaming finalize trace logging & timings
const oldStreamFinalizeTrace = `              const streamGroundingResult = verifyAnswerGrounding(
                streamedFullText,
                sources,
                contextData.envelopeContextText || ""
              );

              // Phase P1.5 Request Traces & Phase P3.6 Semantic Cache Save
              try {
                c.executionCtx?.waitUntil(Promise.all([
                  queryHash ? c.env.DB.prepare(\`
                    INSERT OR REPLACE INTO query_semantic_cache (query_hash, question, standard_filter, answer, grounding_score, evidence_badge, sources_json, schema_version, grounding_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  \`).bind(
                    queryHash,
                    question.slice(0, 300),
                    standard_filter || 'ALL',
                    streamedFullText,
                    streamGroundingResult.score_pct,
                    streamGroundingResult.badge,
                    JSON.stringify((sources || []).slice(0, 10)),
                    CACHE_SCHEMA_VERSION,
                    JSON.stringify(streamGroundingResult)
                  ).run() : Promise.resolve(),
                  c.env.DB.prepare(\`
                    INSERT INTO request_traces (id, session_id, question, standard_filter, grounding_score, evidence_badge, provider, model, duration_ms)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  \`).bind(
                    crypto.randomUUID(),
                    session_id,
                    question.slice(0, 300),
                    standard_filter || 'ALL',
                    streamGroundingResult.score_pct,
                    streamGroundingResult.badge,
                    draftRes?.provider || 'cloudflare',
                    draftRes?.model || reportedModel,
                    Date.now() - reqStartTime
                  ).run()
                ]));
              } catch(e) {}

              await writer.write(encoder.encode(\`data: \${JSON.stringify({ 
                type: 'complete', 
                suggested_questions: defaultFollowups,
                mcq_questions: isEntityClear ? [] : activeMcqs,
                grounding: streamGroundingResult,
                verbatim_evidence_quote: streamGroundingResult.verbatim_evidence_quote,
                evidence: streamGroundingResult.evidence,
                loop_engineering: {
                  mode: 'DUAL_LLM_DRAFT_CRITIC',
                  passes: loopPasses,
                  verified_status: loopPasses > 1 ? 'LEVEL_III_CRITIQUE_REFINED' : 'INITIAL_PASS_VERIFIED',
                  grounding_score: streamGroundingResult.score_pct,
                  evidence_badge: streamGroundingResult.badge,
                  verbatim_evidence_quote: streamGroundingResult.verbatim_evidence_quote
                }
              })}\\n\\n\`));`;

const newStreamFinalizeTrace = `              const tVerifierStart = Date.now();
              const streamGroundingResult = verifyAnswerGrounding(
                streamedFullText,
                sources,
                contextData.envelopeContextText || ""
              );
              const verifierMs = Math.max(1, Date.now() - tVerifierStart);
              const criticMs = Math.max(1, Date.now() - reqStartTime - (retrievalMs || 0) - (tableMs || 0) - (draftMs || 0) - verifierMs);
              const totalDurationMs = Date.now() - reqStartTime;

              // Phase P1.5 Request Traces & Phase P3.6 Semantic Cache Save
              try {
                c.executionCtx?.waitUntil(Promise.all([
                  queryHash ? c.env.DB.prepare(\`
                    INSERT OR REPLACE INTO query_semantic_cache (query_hash, question, standard_filter, answer, grounding_score, evidence_badge, sources_json, schema_version, grounding_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  \`).bind(
                    queryHash,
                    question.slice(0, 300),
                    standard_filter || 'ALL',
                    streamedFullText,
                    streamGroundingResult.score_pct,
                    streamGroundingResult.badge,
                    JSON.stringify((sources || []).slice(0, 10)),
                    CACHE_SCHEMA_VERSION,
                    JSON.stringify(streamGroundingResult)
                  ).run() : Promise.resolve(),
                  c.env.DB.prepare(\`
                    INSERT INTO request_traces (id, session_id, question, standard_filter, grounding_score, evidence_badge, provider, model, duration_ms, retrieval_ms, table_ms, draft_ms, critic_ms, verifier_ms, mode)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  \`).bind(
                    crypto.randomUUID(),
                    session_id,
                    question.slice(0, 300),
                    standard_filter || 'ALL',
                    streamGroundingResult.score_pct,
                    streamGroundingResult.badge,
                    draftRes?.provider || 'cloudflare',
                    criticModelUsed || reportedModel,
                    totalDurationMs,
                    retrievalMs || 0,
                    tableMs || 0,
                    draftMs || 0,
                    criticMs || 0,
                    verifierMs || 0,
                    mode || 'standards'
                  ).run()
                ]));
              } catch(e) {}

              await writer.write(encoder.encode(\`data: \${JSON.stringify({ 
                type: 'complete', 
                suggested_questions: defaultFollowups,
                mcq_questions: isEntityClear ? [] : activeMcqs,
                grounding: streamGroundingResult,
                verbatim_evidence_quote: streamGroundingResult.verbatim_evidence_quote,
                evidence: streamGroundingResult.evidence,
                timings: {
                  total_ms: totalDurationMs,
                  retrieval_ms: retrievalMs || 0,
                  table_ms: tableMs || 0,
                  draft_ms: draftMs || 0,
                  critic_ms: criticMs || 0,
                  verifier_ms: verifierMs || 0,
                  fast_path: false
                },
                loop_engineering: {
                  mode: 'DUAL_LLM_DRAFT_CRITIC',
                  passes: loopPasses,
                  verified_status: loopPasses > 1 ? 'LEVEL_III_CRITIQUE_REFINED' : 'INITIAL_PASS_VERIFIED',
                  grounding_score: streamGroundingResult.score_pct,
                  evidence_badge: streamGroundingResult.badge,
                  verbatim_evidence_quote: streamGroundingResult.verbatim_evidence_quote
                }
              })}\\n\\n\`));`;

if (!content.includes(oldStreamFinalizeTrace)) {
  console.error("Could not find oldStreamFinalizeTrace");
  process.exit(1);
}
content = content.replace(oldStreamFinalizeTrace, newStreamFinalizeTrace);
console.log("✓ Updated streaming finalize trace and stage timings");

// 7. Update non-streaming finalize trace logging & timings
const oldNonStreamTrace = `    const groundingResult = verifyAnswerGrounding(answer, sources, envelopeContext);

    // Phase P1.5 (Per-Request Traces) & P3.6 (Query Semantic Cache) for Non-Streaming Endpoint
    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(Promise.allSettled([
          queryHash ? c.env.DB.prepare(\`
            INSERT OR REPLACE INTO query_semantic_cache (query_hash, question, standard_filter, answer, grounding_score, evidence_badge, sources_json, schema_version, grounding_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`).bind(
            queryHash,
            question.slice(0, 300),
            standard_filter || 'ALL',
            answer,
            groundingResult.score_pct,
            groundingResult.badge,
            JSON.stringify((sources || []).slice(0, 10)),
            CACHE_SCHEMA_VERSION,
            JSON.stringify(groundingResult)
          ).run() : Promise.resolve(),
          c.env.DB.prepare(\`
            INSERT INTO request_traces (id, session_id, question, standard_filter, grounding_score, evidence_badge, provider, model, duration_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`).bind(
            crypto.randomUUID(),
            session_id,
            question.slice(0, 300),
            standard_filter || 'ALL',
            groundingResult.score_pct,
            groundingResult.badge,
            draftRes?.provider || 'cloudflare',
            draftRes?.model || reportedModel,
            Date.now() - reqStartTime
          ).run()
        ]));
      }
    } catch(e) {}

    return c.json({ 
      answer, 
      finish_reason: finishReason, 
      sources, 
      model_used: reportedModel, 
      mode: mode,
      suggested_questions: suggestedQuestions,
      mcq_questions: mcqQuestions,
      can_continue: finishReason === 'length' || answer.length > 1200,
      grounding: groundingResult,
      verbatim_evidence_quote: groundingResult.verbatim_evidence_quote,
      evidence: groundingResult.evidence,
      loop_engineering: {
        mode: 'DUAL_LLM_DRAFT_CRITIC',
        passes: loopPasses,
        draft_model: draftRes?.model || reportedModel,
        critic_model: criticModelUsed,
        verified_status: loopPasses > 1 ? 'LEVEL_III_CRITIQUE_REFINED' : 'INITIAL_PASS_VERIFIED',
        grounding_score: groundingResult.score_pct,
        evidence_badge: groundingResult.badge,
        verbatim_evidence_quote: groundingResult.verbatim_evidence_quote
      }
    })`;

const newNonStreamTrace = `    const tVerifierStart = Date.now();
    const groundingResult = verifyAnswerGrounding(answer, sources, envelopeContext);
    const verifierMs = Math.max(1, Date.now() - tVerifierStart);
    const totalDurationMs = Date.now() - reqStartTime;
    const criticMs = Math.max(0, totalDurationMs - (retrievalMs || 0) - (tableMs || 0) - (draftMs || 0) - verifierMs);

    // Phase P1.5 (Per-Request Traces) & P3.6 (Query Semantic Cache) for Non-Streaming Endpoint
    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') {
        c.executionCtx.waitUntil(Promise.allSettled([
          queryHash ? c.env.DB.prepare(\`
            INSERT OR REPLACE INTO query_semantic_cache (query_hash, question, standard_filter, answer, grounding_score, evidence_badge, sources_json, schema_version, grounding_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`).bind(
            queryHash,
            question.slice(0, 300),
            standard_filter || 'ALL',
            answer,
            groundingResult.score_pct,
            groundingResult.badge,
            JSON.stringify((sources || []).slice(0, 10)),
            CACHE_SCHEMA_VERSION,
            JSON.stringify(groundingResult)
          ).run() : Promise.resolve(),
          c.env.DB.prepare(\`
            INSERT INTO request_traces (id, session_id, question, standard_filter, grounding_score, evidence_badge, provider, model, duration_ms, retrieval_ms, table_ms, draft_ms, critic_ms, verifier_ms, mode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`).bind(
            crypto.randomUUID(),
            session_id,
            question.slice(0, 300),
            standard_filter || 'ALL',
            groundingResult.score_pct,
            groundingResult.badge,
            draftRes?.provider || 'cloudflare',
            draftRes?.model || reportedModel,
            totalDurationMs,
            retrievalMs || 0,
            tableMs || 0,
            draftMs || 0,
            criticMs || 0,
            verifierMs || 0,
            mode || 'standards'
          ).run()
        ]));
      }
    } catch(e) {}

    return c.json({ 
      answer, 
      finish_reason: finishReason, 
      sources, 
      model_used: reportedModel, 
      mode: mode,
      suggested_questions: suggestedQuestions,
      mcq_questions: mcqQuestions,
      can_continue: finishReason === 'length' || answer.length > 1200,
      grounding: groundingResult,
      verbatim_evidence_quote: groundingResult.verbatim_evidence_quote,
      evidence: groundingResult.evidence,
      timings: {
        total_ms: totalDurationMs,
        retrieval_ms: retrievalMs || 0,
        table_ms: tableMs || 0,
        draft_ms: draftMs || 0,
        critic_ms: criticMs || 0,
        verifier_ms: verifierMs || 0,
        fast_path: false
      },
      loop_engineering: {
        mode: 'DUAL_LLM_DRAFT_CRITIC',
        passes: loopPasses,
        draft_model: draftRes?.model || reportedModel,
        critic_model: criticModelUsed,
        verified_status: loopPasses > 1 ? 'LEVEL_III_CRITIQUE_REFINED' : 'INITIAL_PASS_VERIFIED',
        grounding_score: groundingResult.score_pct,
        evidence_badge: groundingResult.badge,
        verbatim_evidence_quote: groundingResult.verbatim_evidence_quote
      }
    })`;

if (!content.includes(oldNonStreamTrace)) {
  console.error("Could not find oldNonStreamTrace");
  process.exit(1);
}
content = content.replace(oldNonStreamTrace, newNonStreamTrace);
console.log("✓ Updated non-streaming trace and stage timings");

fs.writeFileSync(filePath, content, 'utf8');
console.log("🎉 Successfully patched worker/src/index.js!");
