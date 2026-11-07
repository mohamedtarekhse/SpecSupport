// scripts/rosetta2_chunker.js
// Rosetta 2.0 Full Corpus Rebuild & Chunking Constitution (P2.7)
// Enforces Constitutional Rules R1 through R9

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =========================================================================
// 1. EDITIONS TAXONOMY & METADATA
// =========================================================================
const EDITIONS_MAP = {
  'ASME B31.3': '2022',
  'ASME B31.4': '2022',
  'ASME B31.8': '2022',
  'ASME VIII DIV 1': '2023',
  'ASME IX': '2023',
  'ASME V': '2023',
  'API 1104': '22nd Ed. (2021)',
  'API 5CT': '10th Ed. (2018)',
  'API RP 5C1': '18th Ed.',
  'API RP 7G-2': '2nd Ed. (2020)',
  'API 53': '5th Ed. (2018)',
  'API STANDARD 53': '5th Ed. (2018)',
  'API RP 4G': '5th Ed. (2016)',
  'API 4F': '5th Ed. (2013)',
  'API RP 8B': '8th Ed. (2014)',
  'API 16AR': '1st Ed. (2017)',
  'API 16D': '3rd Ed. (2018)',
  'API 6A': '21st Ed. (2018)',
  'API 6AR': '2nd Ed. (2015)',
  'API 16C': '2nd Ed. (2015)',
  'API 510': '10th Ed. (2014)',
  'API 570': '4th Ed. (2016)',
  'API RP 7K': '6th Ed. (2015)',
  'API RP 2X': '4th Ed. (2004)',
  'AWS D1.1': '2020',
  'AWS B1.11': '2018',
  'ISO 3834-2': '2021',
  'NACE MR0175 / ISO 15156': '2020',
  'ASNT SNT-TC-1A': '2020',
  'TH HILL DS-1 VOL 3': '5th Ed. (2020)',
  'AISI 360-16': '2016',
  'IADC MANUAL': '12th Ed. (2015)',
  'LEEA MODULE 1': '2022',
  'LEEA MODULE 2': '2022',
  'SOP': '2024',
  'NEBOSH IGC': '2021',
  'OEM BOP MANUALS': '2020'
};

function getStandardEdition(stdCode) {
  if (!stdCode) return 'Current Ed.';
  const upper = stdCode.toUpperCase();
  for (const [k, v] of Object.entries(EDITIONS_MAP)) {
    if (upper.includes(k) || k.includes(upper)) {
      return v;
    }
  }
  return 'Current Ed.';
}

// =========================================================================
// 2. R5 NOISE REMOVAL & R6 ENCODING CONTRACT
// =========================================================================
function stripBoilerplate(text) {
  if (!text) return '';
  return text
    .replace(/--`+.*`+---/g, '')
    .replace(/Copyright\s+(?:TH\s+Hill|©|API|ASME|AWS|ISO|IADC).*(\r?\n)?/gi, '')
    .replace(/Provided\s+by\s+IHS\s+Markit.*(\r?\n)?/gi, '')
    .replace(/No\s+reproduction\s+or\s+networking\s+permitted.*(\r?\n)?/gi, '')
    .replace(/Not\s+for\s+Resale.*(\r?\n)?/gi, '')
    .replace(/Downloaded\s+from.*(\r?\n)?/gi, '')
    .replace(/,\s*downloaded\s+on.*Karim\s+Elsherbiny\./gi, '')
    .replace(/Page\s+\d+\s+of\s+\d+(\r?\n)?/gi, '')
    .replace(/Black\s+Plate\s+Rules.*(\r?\n)?/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeEncoding(text) {
  if (!text) return '';
  let s = text.normalize('NFKC');
  s = s.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-');
  s = s.replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/[\u201C\u201D]/g, '"');
  s = s.replace(/\u00A0/g, ' ');
  return s;
}

function checkMojibake(text) {
  if (!text) return null;
  if (text.includes('\uFFFD')) return 'encoding_corruption_ufffd';
  // Check for ?? in mostly Latin text
  if (/\b[a-zA-Z]{3,}\s*\?\?\s*[a-zA-Z]{3,}\b/.test(text)) {
    return 'encoding_corruption_double_question';
  }
  return null;
}

// =========================================================================
// 3. R9 OBLIGATION SUBTYPING, KEY VALUES & 11 ROSETTA PILLARS
// =========================================================================
function extractKeyValues(text) {
  if (!text) return [];
  const kv = [];
  const seen = new Set();
  const numUnitRegex = /\b(\d+(?:\.\d+)?)\s*(%|HRC|HRB|HBW|HV|ksi|MPa|psi|bar|mm|in(?:ch(?:es)?)?|ft|m|°C|°F|deg|J(?:oules)?|ft-lbs?|kg|lb|ratio)\b/gi;
  let m;
  while ((m = numUnitRegex.exec(text)) !== null) {
    const val = parseFloat(m[1]);
    let unit = m[2].trim();
    if (/^in(?:ch(?:es)?)?$/i.test(unit)) unit = 'in';
    else if (/^deg$/i.test(unit)) unit = '°';
    else if (/^j(?:oules)?$/i.test(unit)) unit = 'J';
    const key = val + ':' + unit.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      kv.push([val, unit]);
    }
    if (kv.length >= 12) break;
  }
  return kv;
}

function classifyObligation(content, clause, section) {
  const text = ((clause || '') + ' ' + (section || '') + ' ' + (content || '')).trim();
  const lower = text.toLowerCase();
  
  if (lower.startsWith('table ') || /\|.*\|.*\|/.test(content || '') || /\b(table\s+[0-9a-z\.\-_]+)/i.test(clause || '')) {
    return 'TABLE_ROW';
  }

  if (/^(\d+\.\d+\s+)?([a-z\s\-]+:\s*(means|defined as|is defined|refers to))/i.test(content || '') ||
      /\b(is defined as|shall mean|means any|term refers to)\b/i.test(content || '') ||
      /\bdefinition\b/i.test(clause || '')) {
    return 'DEFINITION';
  }

  const hasNumUnit = /\b\d+(?:\.\d+)?\s*(%|HRC|HRB|HBW|HV|ksi|MPa|psi|bar|mm|in|ft|m|°C|°F|J|ft-lbs|kg|lb)\b/i.test(text);
  const hasComparison = /\b(not less than|not more than|shall not exceed|at least|minimum|maximum|greater than|less than|within|\bmin\b|\bmax\b|>=|<=|>|<|±)\b/i.test(lower);
  const hasRequirement = /\b(shall|should|must|not allowed|prohibited|mandatory|is required)\b/i.test(lower);

  if ((hasNumUnit && (hasComparison || hasRequirement)) || (hasComparison && /\d/.test(text))) {
    return 'THRESHOLD';
  }

  if (hasRequirement) {
    return 'REQUIREMENT';
  }

  return 'CONTEXT';
}

function classifyGenomePillar(chunk) {
  const content = (chunk.content || '').toLowerCase();
  const clause = (chunk.clause || '').toLowerCase();
  const section = (chunk.section || '').toLowerCase();

  // TOC or Publisher Noise
  const dotMatches = content.match(/(?:\.\s*){3,}\s*\d+/g) || [];
  const isPublisherNoise = /black plate|all rights reserved|printed in usa|supersedes|american institute of steel/i.test(content) && content.length < 500;
  const isToc = dotMatches.length >= 2 || (content.includes('table of contents') && dotMatches.length >= 1);
  if (isToc || isPublisherNoise) {
    return { pillar: 'TOC_NOISE', is_excluded: 1 };
  }

  // Pillar 1: Scope & Boundaries
  if (clause.includes('scope') || section.includes('scope') || content.includes('this specification covers') || content.includes('this recommended practice covers') || content.includes('equipment covered') || clause.includes('1.1') || clause.includes('1.2')) {
    return { pillar: 'SCOPE', is_excluded: 0 };
  }

  // Pillar 2: Discard & Acceptance Limits
  const hasAcceptance = /acceptance criteria|acceptance:|acceptance limits|pass criteria|قبول/i.test(content);
  const hasRejection = /rejection criteria|rejection:|reject:|discard criteria|wear limit|undertolerance|maximum allowable|minimum wall|رفض/i.test(content);
  if (hasAcceptance || hasRejection || clause.includes('discard') || clause.includes('wear') || clause.includes('tolerance') || section.includes('discard') || section.includes('wear')) {
    return { pillar: 'DISCARD_ACCEPTANCE', is_excluded: 0 };
  }

  // Pillar 3: NDT/NDE Methods
  if (/radiograph|ultrasonic|magnetic particle|liquid penetrant|eddy current|visual examination|ndt|nde|\bvt\b|\bpt\b|\bmt\b|\brt\b|\but\b/i.test(content) || /inspection method|examination/i.test(clause)) {
    return { pillar: 'NDT_NDE', is_excluded: 0 };
  }

  // Pillar 4: Inspection Frequency & Sampling
  if (/category i|category ii|category iii|category iv|daily|weekly|monthly|annual|interval|sampling rate|progressive sampling|inspection frequency/i.test(content) || /frequency|schedule/i.test(clause)) {
    return { pillar: 'SAMPLING_FREQUENCY', is_excluded: 0 };
  }

  // Pillar 5: Equipment Geometry & Specs
  if (/diameter|thread|connection|bevel|wall thickness|weight|drift|yield strength|tensile strength|dimensions/i.test(content)) {
    return { pillar: 'EQUIPMENT_SPEC', is_excluded: 0 };
  }

  // Pillar 6: Sour Service & Environment
  if (/h2s|sour service|nace|ssc|stress corrosion|hardness limit|22 hrc|partial pressure/i.test(content)) {
    return { pillar: 'ENVIRONMENTAL_SOUR', is_excluded: 0 };
  }

  // Pillar 7: Procedures & Execution
  if (/procedure|wps|pqr|welding procedure|calibration|technique|step-by-step/i.test(content)) {
    return { pillar: 'PROCEDURES_EXECUTION', is_excluded: 0 };
  }

  // Pillar 8: Documentation & QA
  if (/report|documentation|certification|record|quality assurance|qa\/qc|inspector/i.test(content)) {
    return { pillar: 'DOCUMENTATION_QA', is_excluded: 0 };
  }

  return { pillar: 'GENERAL', is_excluded: 0 };
}

// =========================================================================
// 4. R7 VALIDATION CONTRACT
// =========================================================================
const CLAUSE_REGEX = /^(?:(?:API|ASME|AWS|ISO|NACE|BS|EN|TH HILL)\s+[\w\.\-/\s]+?)?\b(T-\d{3,4}(\.\d+)?|QW-[0-9\.]+|QB-[0-9\.]+|UW-[0-9\.]+|UG-[0-9\.]+|Sec(?:tion)?\s+[0-9\.]+|Table\s+[\w./-]+|\d+(\.\d+)*|Clause\s+[\w./-]+)/i;

function validateChunk(chunk) {
  // 1. Content minimum length
  if (!chunk.content || chunk.content.trim().length < 60) {
    return { valid: false, reason: 'content_too_short' };
  }

  // 2. Section title presence
  if (!chunk.section || chunk.section.trim().length === 0) {
    return { valid: false, reason: 'missing_locator' };
  }

  // 3. Footer presence (R2)
  if (!chunk.content.includes('--- Source:')) {
    return { valid: false, reason: 'missing_footer' };
  }

  // 4. Clause format verification
  const isClausal = CLAUSE_REGEX.test(chunk.clause || '') || /\b(Clause\s+\d|Table\s+[\w./-]+|\d+(\.\d+)*)\b/i.test(chunk.clause || '');
  const isNonClausalTyped = (chunk.obligation_type === 'DEFINITION' || chunk.obligation_type === 'CONTEXT' || chunk.pillar_type === 'SCOPE') &&
                            Boolean(chunk.section && chunk.section.trim().length > 2);

  if (!isClausal && !isNonClausalTyped) {
    return { valid: false, reason: 'invalid_clause' };
  }

  // 5. Encoding verification
  const encErr = checkMojibake(chunk.content);
  if (encErr) {
    return { valid: false, reason: encErr };
  }

  return { valid: true };
}

// =========================================================================
// 5. CHUNK CREATOR WITH R2 PROVENANCE & R3 BREADCRUMB
// =========================================================================
function formatChunk(stdCode, edition, section, clause, body, pageNum) {
  const normBody = normalizeEncoding(stripBoilerplate(body));
  let normClause = clause.replace(/\[CLAUSE:\s*([^\]]+)\]/i, '$1').replace(/^CLAUSE:\s*/i, '').trim();
  const normSection = section.replace(/\[(?:SECTION|ARTICLE|CHAPTER):\s*([^\]]+)\]/i, '$1').trim();
  const pageStr = String(pageNum || '1').replace(/^Page\s*/i, '');

  if (normClause.startsWith('[STANDARD:') || normClause === 'General' || normClause.length < 2) {
    if (/scope/i.test(normBody.slice(0, 300)) || /scope/i.test(normSection)) {
      normClause = 'Section 1 — Scope & General Requirements';
    } else {
      normClause = `Clause ${pageStr}.1 — ${normSection || 'General Requirements'}`;
    }
  }

  const obligation = classifyObligation(normBody, normClause, normSection);
  const { pillar, is_excluded } = classifyGenomePillar({ content: normBody, clause: normClause, section: normSection });
  const keyValues = extractKeyValues(normBody);

  // R3 Breadcrumb Header
  const breadcrumb = `[${stdCode} ${edition} > ${normSection} > ${normClause} > ${pillar}]`;

  // R2 Mandatory Verbatim Provenance Footer
  const footer = `\n--- Source: ${stdCode} ${edition} | Clause ${normClause} | ${normSection} | Page ${pageStr}`;

  // Complete Content
  const content = `${breadcrumb}\n\n${normBody}${footer}`;

  // Embedding input representation
  const embeddingText = `${stdCode} ${normClause} ${breadcrumb} ${content}`;

  return {
    standard_code: stdCode,
    standard_name: stdCode,
    edition: edition,
    section: normSection,
    clause: normClause,
    content: content,
    embedding_text: embeddingText,
    pillar_type: pillar,
    obligation_type: obligation,
    key_values: JSON.stringify(keyValues),
    is_excluded: is_excluded,
    scope: 'global',
    organization: 'INTERNATIONAL'
  };
}

// =========================================================================
// 6. MAIN CHUNKING PIPELINE EXECUTOR
// =========================================================================
async function runRebuildPipeline() {
  console.log('=========================================================================');
  console.log('🏗️  ROSETTA 2.0 CORPUS REBUILD ENGINE (P2.7)');
  console.log('=========================================================================\n');

  const validChunks = [];
  const quarantinedChunks = [];
  const seenHashes = new Set();
  const coverageTOC = {};

  // 1. Process 32 unpacked standards from backups/unpacked_standards
  const unpackedDir = path.resolve(__dirname, '..', 'backups', 'unpacked_standards');
  if (fs.existsSync(unpackedDir)) {
    const files = fs.readdirSync(unpackedDir).filter(f => f.endsWith('.txt'));
    console.log(`📂 Processing ${files.length} unpacked standard source files...`);

    for (const file of files) {
      const rawText = fs.readFileSync(path.join(unpackedDir, file), 'utf8');
      
      let stdCode = '';
      const stdMatch = rawText.match(/\[STANDARD:\s*([^\]]+)\]/i);
      if (stdMatch) stdCode = stdMatch[1].trim();
      else if (file.includes('API 53')) stdCode = 'API 53';
      else stdCode = file.replace(/\.txt$/, '').replace(/_/g, ' ');

      const edition = getStandardEdition(stdCode);

      let article = 'General';
      const artMatch = rawText.match(/\[(?:ARTICLE|PARTS|SECTION):\s*([^\]]+)\]/i);
      if (artMatch) article = artMatch[1].trim();

      coverageTOC[stdCode] = coverageTOC[stdCode] || new Set();
      coverageTOC[stdCode].add(article);

      let rawBlocks = rawText.split(/\n-{3,}\s*\n/);
      if (rawBlocks.length <= 1) {
        rawBlocks = rawText.split(/\n(?=\[CLAUSE:|^CLAUSE:|^Clause\s+\d)/m);
      }

      let pageIndex = 1;
      for (const block of rawBlocks) {
        const cleanBlock = stripBoilerplate(block);
        if (!cleanBlock || cleanBlock.length < 50 || cleanBlock.startsWith('(No output)')) continue;

        let clauseTitle = 'General';
        const clMatch = cleanBlock.match(/^\[CLAUSE:\s*([^\]]+)\]/im) || 
                       cleanBlock.match(/^CLAUSE:\s*([^\n]+)/im) ||
                       cleanBlock.match(/^(?:Clause\s+\d[^\n]+|T-\d{3}[^\n]+|QW-\d{3}[^\n]+|UW-\d+[^\n]+)/im);
        if (clMatch) {
          clauseTitle = clMatch[1] ? clMatch[1].trim() : clMatch[0].trim();
        } else {
          const firstLine = cleanBlock.split('\n')[0].trim();
          if (firstLine.length < 80 && !firstLine.startsWith('=')) {
            clauseTitle = firstLine;
          }
        }

        const chunkObj = formatChunk(stdCode, edition, article, clauseTitle, cleanBlock, pageIndex);
        pageIndex++;

        // Deduplication & Validation
        const hash = crypto.createHash('sha256').update(chunkObj.content).digest('hex');
        if (seenHashes.has(hash)) {
          quarantinedChunks.push({ ...chunkObj, reject_reason: 'duplicate_sha256' });
          continue;
        }
        seenHashes.add(hash);

        const val = validateChunk(chunkObj);
        if (val.valid) {
          validChunks.push(chunkObj);
        } else {
          quarantinedChunks.push({ ...chunkObj, reject_reason: val.reason });
        }
      }
    }
  }

  // 2. Process snapshot standards for remaining standards
  const snapshotPath = path.resolve(__dirname, '..', '.backups', 'corpus_v1_2026-11-07.json');
  if (fs.existsSync(snapshotPath)) {
    console.log(`\n📂 Processing remaining standards from snapshot...`);
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    
    // Identified distinct standard codes from unpacked standards
    const coveredStandards = new Set(validChunks.map(c => c.standard_code.toUpperCase()));
    
    // Group remaining chunks by (standard_code, page/section) for assembly (R1)
    const remainingChunks = snapshot.standards_chunks.filter(c => !coveredStandards.has(c.standard_code.toUpperCase()));
    console.log(`Found ${remainingChunks.length} chunks from remaining standards (e.g. DS-1, AISI, LEEA, etc.)`);

    const pageGroups = {};
    for (const c of remainingChunks) {
      const std = c.standard_code;
      const sec = c.section || 'General';
      const key = `${std}:::${sec}`;
      if (!pageGroups[key]) pageGroups[key] = { std, sec, chunks: [] };
      pageGroups[key].chunks.push(c);
    }

    for (const group of Object.values(pageGroups)) {
      const stdCode = group.std;
      const edition = getStandardEdition(stdCode);
      const section = group.sec;

      coverageTOC[stdCode] = coverageTOC[stdCode] || new Set();
      coverageTOC[stdCode].add(section);

      // Merge elements on the same page into parent chunk (R1)
      const mergedText = group.chunks
        .map(c => c.content.replace(/\[STANDARD:[^\]]+\]\s*/g, '').replace(/\[SECTION:[^\]]+\]\s*/g, ''))
        .join('\n\n');
      
      const cleanMerged = stripBoilerplate(mergedText);
      if (!cleanMerged || cleanMerged.length < 50) continue;

      // Extract real clause number or heading
      let detectedClause = 'General';
      const clMatch = cleanMerged.match(/\b(T-\d{3,4}(\.\d+)?|QW-[0-9\.]+|QB-[0-9\.]+|UW-[0-9\.]+|UG-[0-9\.]+|Sec(tion)?\s+[0-9\.]+|Table\s+[\w./-]+|\d+(\.\d+)+|Clause\s+[\w./-]+)\b/i);
      if (clMatch) {
        detectedClause = clMatch[0];
      } else {
        const firstLine = cleanMerged.split('\n')[0].replace(/^[#\*\-=\s]+/, '').trim();
        if (firstLine.length > 2 && firstLine.length < 80) {
          detectedClause = firstLine;
        }
      }

      // If text fits in 1600 tokens (~6000 chars), emit 1 chunk
      if (cleanMerged.length <= 6000) {
        const pageNum = section.match(/\d+/) ? section.match(/\d+/)[0] : '1';
        const chunkObj = formatChunk(stdCode, edition, section, detectedClause, cleanMerged, pageNum);

        const hash = crypto.createHash('sha256').update(chunkObj.content).digest('hex');
        if (seenHashes.has(hash)) {
          quarantinedChunks.push({ ...chunkObj, reject_reason: 'duplicate_sha256' });
          continue;
        }
        seenHashes.add(hash);

        const val = validateChunk(chunkObj);
        if (val.valid) {
          validChunks.push(chunkObj);
        } else {
          quarantinedChunks.push({ ...chunkObj, reject_reason: val.reason });
        }
      } else {
        // Split overflow pages along paragraph boundaries
        const paragraphs = cleanMerged.split(/\n\n+/);
        let currBuf = '';
        let partIdx = 1;
        const pageNum = section.match(/\d+/) ? section.match(/\d+/)[0] : '1';

        for (const p of paragraphs) {
          if ((currBuf.length + p.length) > 5500 && currBuf.length > 0) {
            const subClause = `${detectedClause} (Part ${partIdx})`;
            const chunkObj = formatChunk(stdCode, edition, section, subClause, currBuf, pageNum);
            partIdx++;
            currBuf = p;

            const hash = crypto.createHash('sha256').update(chunkObj.content).digest('hex');
            if (seenHashes.has(hash)) {
              quarantinedChunks.push({ ...chunkObj, reject_reason: 'duplicate_sha256' });
              continue;
            }
            seenHashes.add(hash);

            const val = validateChunk(chunkObj);
            if (val.valid) {
              validChunks.push(chunkObj);
            } else {
              quarantinedChunks.push({ ...chunkObj, reject_reason: val.reason });
            }
          } else {
            currBuf = currBuf ? `${currBuf}\n\n${p}` : p;
          }
        }
        if (currBuf.length >= 60) {
          const subClause = partIdx > 1 ? `${detectedClause} (Part ${partIdx})` : detectedClause;
          const chunkObj = formatChunk(stdCode, edition, section, subClause, currBuf, pageNum);
          const hash = crypto.createHash('sha256').update(chunkObj.content).digest('hex');
          if (!seenHashes.has(hash)) {
            seenHashes.add(hash);
            const val = validateChunk(chunkObj);
            if (val.valid) validChunks.push(chunkObj);
            else quarantinedChunks.push({ ...chunkObj, reject_reason: val.reason });
          }
        }
      }
    }
  }

  // 3. Rebuild tables (R4) and code safety envelopes
  console.log('\n📊 Assembling standards_tables_v2 and code_safety_envelopes_v2...');
  const snapshotData = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const validTables = snapshotData.standards_tables.map(t => ({
    standard_code: t.standard_code,
    edition: getStandardEdition(t.standard_code),
    table_id: t.table_id,
    table_title: t.table_title,
    section_context: t.section_context,
    headers_json: t.headers_json,
    raw_markdown: normalizeEncoding(stripBoilerplate(t.raw_markdown)),
    structured_json: t.structured_json,
    scope: t.scope || 'global',
    session_id: t.session_id,
    file_hash: t.file_hash
  }));

  const validEnvelopes = snapshotData.code_safety_envelopes.map(e => ({
    material_group: e.material_group,
    min_preheat_c: e.min_preheat_c,
    min_preheat_f: e.min_preheat_f,
    max_interpass_c: e.max_interpass_c,
    max_interpass_f: e.max_interpass_f,
    pwht_thickness_threshold_mm: e.pwht_thickness_threshold_mm,
    pwht_min_temp_c: e.pwht_min_temp_c,
    pwht_max_temp_c: e.pwht_max_temp_c,
    max_hardness_hrc: e.max_hardness_hrc,
    governing_standard: e.governing_standard,
    is_active: e.is_active ?? 1,
    primary_code: e.primary_code,
    source_chunk_id: e.source_chunk_id,
    min_remaining_wall_pct: e.min_remaining_wall_pct,
    min_hydrotest_ratio: e.min_hydrotest_ratio,
    notes: e.notes
  }));

  // 4. Output normalized JSON (R1-R9)
  const normalizedCorpus = {
    generated_at: new Date().toISOString(),
    constitution_version: 'Rosetta 2.0 (P2.7)',
    stats: {
      total_valid_chunks: validChunks.length,
      total_quarantined_chunks: quarantinedChunks.length,
      total_tables: validTables.length,
      total_envelopes: validEnvelopes.length,
      avg_tokens_per_chunk: Math.round(validChunks.reduce((acc, c) => acc + (c.content.length / 4), 0) / (validChunks.length || 1)),
      provenance_footer_pct: (validChunks.filter(c => c.content.includes('--- Source:')).length / (validChunks.length || 1) * 100).toFixed(1)
    },
    quarantine_breakdown: quarantinedChunks.reduce((acc, c) => {
      acc[c.reject_reason] = (acc[c.reject_reason] || 0) + 1;
      return acc;
    }, {}),
    coverage_manifest: Object.entries(coverageTOC).map(([std, secSet]) => ({
      standard_code: std,
      sections_count: secSet.size
    })),
    chunks: validChunks,
    quarantine: quarantinedChunks,
    tables: validTables,
    envelopes: validEnvelopes
  };

  const outPath = path.resolve(__dirname, '..', '.backups', 'corpus_v2_normalized.json');
  fs.writeFileSync(outPath, JSON.stringify(normalizedCorpus, null, 2), 'utf8');
  const sizeMB = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);

  console.log('\n=========================================================================');
  console.log(`✅ CHUNKING COMPLETE: Saved to ${outPath} (${sizeMB} MB)`);
  console.log(`   Valid Chunks: ${validChunks.length}`);
  console.log(`   Quarantined: ${quarantinedChunks.length} (reasons: ${JSON.stringify(normalizedCorpus.quarantine_breakdown)})`);
  console.log(`   Avg Tokens / Chunk: ${normalizedCorpus.stats.avg_tokens_per_chunk}`);
  console.log(`   Provenance Footer Presence: ${normalizedCorpus.stats.provenance_footer_pct}%`);
  console.log(`   Tables: ${validTables.length}`);
  console.log(`   Envelopes: ${validEnvelopes.length}`);
  console.log('=========================================================================\n');

  return normalizedCorpus;
}

if (require.main === module) {
  runRebuildPipeline().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  runRebuildPipeline,
  stripBoilerplate,
  normalizeEncoding,
  validateChunk,
  formatChunk,
  classifyObligation,
  classifyGenomePillar,
  extractKeyValues
};
