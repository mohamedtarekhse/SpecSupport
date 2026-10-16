const fs = require('fs');

let worker = fs.readFileSync('worker/src/index.js', 'utf8');

// 1. Add detectTargetPillars and expandRosettaKeywords helper functions
const rosettaHelpers = `
// ========================================================================
// 🧬 THE 11 ROSETTA GENOME PILLARS: DETERMINISTIC INTENT & KEYWORD ROUTER
// Replaces free-form hallucinated HyDE with exact engineering retrieval gates
// ========================================================================
function detectTargetPillars(q) {
  const qLower = q.toLowerCase();
  const targetPillars = [];

  // 1. DISCARD_LIMITS (Acceptance / Rejection / Wear / Tolerances)
  if (/wear|limit|discard|rejection|reject|scrap|condemn|allowable|tolerance|maximum allowable|minimum wall|undercut|pit depth|hrc|hardness limit|22 hrc|23 hrc|80%|70%/i.test(qLower)) {
    targetPillars.push('DISCARD_LIMITS');
  }

  // 2. DESIGN_FORMULA (Engineering formulas, wall calculations, hydrotest ratios)
  if (/formula|calculate|equation|maop|smys|barlow|tmin|minimum thickness|wall thickness formula|hoop stress|design pressure|1\\.3|1\\.5|1\\.25|ug-27|304\\.1\\.2/i.test(qLower)) {
    targetPillars.push('DESIGN_FORMULA');
  }

  // 3. TABLE_ANNEX (Tables, schedules, dimensions)
  if (/table|annex|appendix|qw-451|figure|table 1|table 341\\.3\\.2|table 330|table 331/i.test(qLower)) {
    targetPillars.push('TABLE_ANNEX');
  }

  // 4. SCOPE (Demarcation, battery limits, equipment inclusion/exclusion)
  if (/scope|cover|applicable|boundary|out-of-scope|does api|does asme|which standard covers/i.test(qLower)) {
    targetPillars.push('SCOPE');
  }

  // 5. TEST_METHOD / PROCEDURE (NDT technique, dwell, lux, couplant, calibration, PWHT)
  if (/test method|how to inspect|calibration|couplant|pie gauge|lux|intensity|angle beam|dwell time|soak time|preheat|pwht/i.test(qLower)) {
    targetPillars.push('TEST_METHOD', 'PROCEDURE');
  }

  // 6. QUALITY_DOCS (Certificates, MTR, COC, retention, hold points)
  if (/mtr|mill test|coc|certificate|retention|audit|document|hold point|witness point/i.test(qLower)) {
    targetPillars.push('QUALITY_DOCS');
  }

  // 7. PREQUAL_WPS (WPS, PQR, welding variables, filler metals, welder qualifications)
  if (/wps|pqr|welding procedure|prequalified|qw-482|f-no|a-no|p-no|f-number|a-number|p-number|filler metal|electrode|welder qualification|6g|groove/i.test(qLower)) {
    targetPillars.push('PREQUAL_WPS', 'PROCEDURE');
  }

  // 8. SERVICE_CATEGORY (Periodic inspection intervals, Cat I-IV, DS-1 tiers)
  if (/category\\s*(?:i|ii|iii|iv|1|2|3|4|5)|cat\\s*(?:i|ii|iii|iv)|interval|frequency|periodic inspection/i.test(qLower)) {
    targetPillars.push('SERVICE_CATEGORY');
  }

  return Array.from(new Set(targetPillars));
}

function expandRosettaKeywords(question, detectedStd, targetPillars) {
  let expansions = [];
  const qL = question.toLowerCase();

  if (targetPillars.includes('DISCARD_LIMITS')) {
    expansions.push("mandatory acceptance rejection limits discard criteria maximum allowable wear tolerance");
  }
  if (targetPillars.includes('DESIGN_FORMULA')) {
    expansions.push("design formula calculation nominal thickness Barlow MAOP hoop stress");
  }
  if (targetPillars.includes('PREQUAL_WPS')) {
    expansions.push("ASME Section IX Form QW-482 P-Number F-Number A-Number essential variables");
  }
  if (targetPillars.includes('TEST_METHOD')) {
    expansions.push("ASME Section V ASTM examination technique calibration sensitivity lux illumination");
  }
  if (targetPillars.includes('QUALITY_DOCS')) {
    expansions.push("EN 10204 Type 3.1 3.2 MTR Certificate Conformance hold point retention");
  }
  if (detectedStd) {
    expansions.push(detectedStd);
  }

  return expansions.length > 0 ? (question + " " + expansions.join(" ")) : question;
}
`;

// Insert the helper functions before prepareContextAndMessages
const anchorFunc = "async function prepareContextAndMessages(c, question, language, session_id, standard_filter, history, mode = 'web', selected_standards = []) {";
if (worker.includes(anchorFunc)) {
  worker = worker.replace(anchorFunc, rosettaHelpers + "\n" + anchorFunc);
  console.log('Added Rosetta helper functions.');
} else {
  console.error('Could not find anchorFunc');
}

// 2. Replace the free-form HyDE block with Rosetta Pillar Synthesis
const oldHydeBlock = `  // 2. HyDE Query Expansion (Bypass if explicit clause or table ID is present to save 1s latency)
  let searchQuestion = question;
  const hasExplicitClause = /(?:UG-\\d+|UW-\\d+|Table\\s*[\\dA-Z\\.]+|\\b\\d+\\.\\d+(?:\\.\\d+)?\\b|T-\\d+|Section\\s*\\d+|Cat(?:egory)?\\s*IV)/i.test(question);
  if (!hasExplicitClause) {
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
  }`;

const newRosettaSynthesisBlock = `  // 2. 🧬 Deterministic Rosetta Genome Query Synthesis (Replaces Hallucinated HyDE)
  const targetPillars = detectTargetPillars(question);
  const searchQuestion = expandRosettaKeywords(question, detectedStd, targetPillars);`;

if (worker.includes(oldHydeBlock)) {
  worker = worker.replace(oldHydeBlock, newRosettaSynthesisBlock);
  console.log('Replaced free-form HyDE with Deterministic Rosetta Synthesis.');
} else {
  console.error('Could not find oldHydeBlock');
}

// 3. Update SQL query to include pillar_type, acceptance_limits, rejection_limits, normative_refs, qa_docs
const oldSqlQuery = `  // 5. Multi-Tier Scoped SQL Query: Global + Shared Company + Session Sandbox
  let query = \`
    SELECT id, standard_code, standard_name, section, clause, content, embedding, scope, organization 
    FROM standards_chunks 
    WHERE (scope = 'global' OR scope IS NULL OR (scope = 'private_temp' AND session_id = ?))
      AND (is_excluded = 0 OR is_excluded IS NULL)
  \``;

const newSqlQuery = `  // 5. Multi-Tier Scoped SQL Query with 11 Rosetta Genome Pillars
  let query = \`
    SELECT id, standard_code, standard_name, section, clause, content, embedding, scope, organization,
           pillar_type, acceptance_limits, rejection_limits, normative_refs, qa_docs 
    FROM standards_chunks 
    WHERE (scope = 'global' OR scope IS NULL OR (scope = 'private_temp' AND session_id = ?))
      AND (is_excluded = 0 OR is_excluded IS NULL)
  \``;

if (worker.includes(oldSqlQuery)) {
  worker = worker.replace(oldSqlQuery, newSqlQuery);
  console.log('Updated SQL query to retrieve Rosetta pillar metadata.');
} else {
  console.error('Could not find oldSqlQuery');
}

// 4. Update Candidate Filtering and ColBERT Scoring to boost target Rosetta Pillars
const oldColbertScoring = `  // ColBERT-Style Sub-Token Late Interaction Scoring
  const queryTokens = question.match(/[0-9a-zA-Z\\.\\-_/]+/g) || []
  scoredChunks.forEach(chunk => {
    let tokenBoost = 0
    const contentLower = (chunk.clause + " " + chunk.content).toLowerCase()
    for (const tok of queryTokens) {
      if (tok.length >= 3 && contentLower.includes(tok.toLowerCase())) {
        if (/\\d/.test(tok) || tok.includes('.')) {
          tokenBoost += 0.35
        } else {
          tokenBoost += 0.05
        }
      }
    }
    const stdMatchBoost = (detectedStd && chunk.standard_code && chunk.standard_code.toUpperCase().includes(detectedStd)) ? 0.40 : 0;
    chunk.final_retrieval_score = chunk.rrf_score + tokenBoost + stdMatchBoost
  })`;

const newColbertScoring = `  // ColBERT-Style Sub-Token Late Interaction Scoring + Rosetta Pillar Prioritization
  const queryTokens = question.match(/[0-9a-zA-Z\\.\\-_/]+/g) || []
  scoredChunks.forEach(chunk => {
    let tokenBoost = 0
    const contentLower = (chunk.clause + " " + chunk.content).toLowerCase()
    for (const tok of queryTokens) {
      if (tok.length >= 3 && contentLower.includes(tok.toLowerCase())) {
        if (/\\d/.test(tok) || tok.includes('.')) {
          tokenBoost += 0.35
        } else {
          tokenBoost += 0.05
        }
      }
    }
    const stdMatchBoost = (detectedStd && chunk.standard_code && chunk.standard_code.toUpperCase().includes(detectedStd)) ? 0.40 : 0;
    
    // 🧬 Rosetta Genome Pillar Match Boost (Up to +0.50 score boost for ground-truth pillar)
    let pillarBoost = 0;
    if (chunk.pillar_type && targetPillars.includes(chunk.pillar_type)) {
      pillarBoost += 0.45;
    } else if (chunk.pillar_type === 'TABLE_ANNEX') {
      pillarBoost += 0.25;
    }
    if (chunk.acceptance_limits || chunk.rejection_limits) {
      pillarBoost += 0.20;
    }

    chunk.final_retrieval_score = chunk.rrf_score + tokenBoost + stdMatchBoost + pillarBoost
  })`;

if (worker.includes(oldColbertScoring)) {
  worker = worker.replace(oldColbertScoring, newColbertScoring);
  console.log('Updated ColBERT scoring to inject Rosetta Genome pillar boosts.');
} else {
  console.error('Could not find oldColbertScoring');
}

// 5. Update topChunks formatting to surface Rosetta Pillar Metadata to LLM context
const oldTopChunks = `  let contextText = ""
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
  })`;

const newTopChunks = `  let contextText = ""
  let hasPrivateSpec = false
  topChunks.forEach((chunk, idx) => {
    if (chunk.scope === 'private_temp' || chunk.scope === 'company_shared') hasPrivateSpec = true
    const exactTag = chunk.is_exact_clause_hit ? " [EXACT CLAUSE MATCH]" : ""
    const pillarTag = chunk.pillar_type ? \` [ROSETTA PILLAR: \${chunk.pillar_type}]\` : ""
    let metaLines = ""
    if (chunk.acceptance_limits) metaLines += \`\\n[VERIFIED ACCEPTANCE]: \${chunk.acceptance_limits}\`
    if (chunk.rejection_limits) metaLines += \`\\n[MANDATORY REJECTION]: \${chunk.rejection_limits}\`
    if (chunk.normative_refs) metaLines += \`\\n[NORMATIVE BRIDGE]: \${chunk.normative_refs}\`
    if (chunk.qa_docs) metaLines += \`\\n[QA AUDIT DOCS]: \${chunk.qa_docs}\`

    contextText += \`[Source \${idx+1}\${exactTag}\${pillarTag}] Standard: \${chunk.standard_code} | Clause: \${chunk.clause}\${metaLines}\\n\${chunk.content}\\n\\n\`
    sources.push({ 
      standard: chunk.standard_code, 
      clause: chunk.clause,
      verified_db: true,
      chunk_id: chunk.id,
      pillar: chunk.pillar_type || 'GENERAL'
    })
  })`;

if (worker.includes(oldTopChunks)) {
  worker = worker.replace(oldTopChunks, newTopChunks);
  console.log('Updated topChunks context formatting with Rosetta metadata.');
} else {
  console.error('Could not find oldTopChunks');
}

fs.writeFileSync('worker/src/index.js', worker, 'utf8');
console.log('Successfully wrote changes to worker/src/index.js');
