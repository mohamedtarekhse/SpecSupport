# FINAL GATE REPORT — Scheduled post-quota-reset verification
Run completed: 2026-11-06 00:10:01 UTC
Health gate at start: embedding_ai + cross_encoder_reranker = PASS

## 1. Golden Evals (raw scorecard tail)
```
[NDT-01] ✅ PASS | NDT Inspection       | Rule: 1.8 to 4.0 for X-ray; 2.0 to 4.0 for Gamma-ray
[NDT-02] ✅ PASS | NDT Inspection       | Rule: Indications exceeding 20% or 50% DAC must be recorded depending on geometry
[NDT-03] ✅ PASS | NDT Inspection       | Rule: Minimum 1000 lux (100 foot-candles) illumination
[RIG-01] ✅ PASS | Tubular Inspection   | Rule: Maximum 22 HRC (or 23 HRC max threshold) to prevent sulfide stress cracking
[RIG-02] ✅ PASS | Tubular Inspection   | Rule: Premium class requires 80% minimum remaining nominal wall thickness
[RIG-03] ✅ PASS | Well Control         | Rule: Low pressure test 250 - 350 PSI; high pressure test to full rated working pressure

=========================================================================
📈 EVALUATION SCORECARD: 14 / 14 Passed (100.0%)
   Citation Coverage: 14/14
   Numerical Ground Truth: 14/14
=========================================================================
✨ EVALUATION STATUS: METRIC GATE PASSED (100.0% Pass Rate. Ready for Production CI/CD)

```
## 2. 31-Test Deep Audit (results)
```
=========================================================================
🔬 SPEC-SUPPORT DEEP AUDIT: CROSS-ENCODER & JSON SCHEMA TRIAGE
Target API: https://inspection-api.mohamedtarekhse.workers.dev
=========================================================================

🔹 SECTION 1: CROSS-ENCODER RE-RANKER ACCURACY & PERFORMANCE

[Test 1.1] System Doctor Model Health Check:
  ✅ [PASS] Cross-Encoder model reports PASS in Doctor check
     └─ Latency: 302ms, Model: @cf/baai/bge-reranker-base

[Test 1.2] Discriminator Test: Static vs Cyclically Loaded Welds (AWS D1.1 Table 6.1)
  ✅ [PASS] Sources array contains retrieved items
     └─ Count: 5
  ✅ [PASS] Cross-Encoder rerank_score is computed and populated
     └─ Top source rerank score: null

[Test 1.3] Alloy Discrimination: P-15E (P91) vs P-1 Carbon Steel Preheat
  ✅ [PASS] Answer correctly identifies 200°C (400°F) preheat for P-15E
     └─ Answer sample: "**MINIMUM PREHEAT: 400°F (200°C) for all wall thicknesses of P-No. 15E Grade 91 pipe** — per ASME B31.3 Table 330.1.1, with the qualification baseline..."
  ✅ [PASS] Level III Critic verified the answer against code_safety_envelopes
     └─ Status: LEVEL_III_CRITIQUE_REFINED


🔹 SECTION 2: STRONGLY-TYPED JSON SCHEMA TRIAGE VERIFICATION

[Test 2.1] Testing Triage Discipline: Welding & WPS (ASME IX / B31.3)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
[Test 2.2] Testing Triage Discipline: NDT Examination (ASME V / ISO 9712)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
[Test 2.3] Testing Triage Discipline: Hydrostatic Testing (ASME B31.3 / B31.4 / B31.8)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
[Test 2.4] Testing Triage Discipline: Asset Integrity & Fitness For Service (API 510 / 570 / 579)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
[Test 2.5] Testing Triage Discipline: Hoisting Equipment (API RP 8B / 4G)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
[Test 2.6] Testing Triage Discipline: Drill Stem & Tubulars (API RP 7G-2 / DS-1)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
[Test 2.7] Testing Triage Discipline: Well Control & BOP (API Standard 53)
  ✅ [PASS] Schema validation: Each question has string question & >= 2 string options
     └─ All options valid
  ✅ [PASS] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Markdown stream clean


🔹 SECTION 3: NEGATIVE CONTROL (DEFINITIVE QUERY)

[Test 3.1] Specific Query: Should answer directly with ZERO triage MCQs
  ✅ [PASS] Specific query emits 0 triage MCQs (immediate definitive response)
     └─ MCQ count: 0


🔹 SECTION 4: NON-STREAMING JSON ENDPOINT PARITY

[Test 4.1] Testing Non-Streaming /api/ask with Triage Query
  ✅ [PASS] Non-streaming endpoint returns mcq_questions array
     └─ Count: 4
  ✅ [PASS] Non-streaming answer text has HTML comment tags stripped
     └─ Answer text clean

=========================================================================
📊 FINAL VERIFICATION SCORECARD: 16 / 31 Passed (51.6%)
=========================================================================
  ❌ [FAIL] Reranker prioritizes Cyclically Loaded criteria over Static criteria
     └─ Reason: Top clause: "6.1 — Inspection of Materials and Equipment"
  ❌ [FAIL] Discipline "Welding & WPS (ASME IX / B31.3)" emits 4 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Reason: Detected leaked comment tag
  ❌ [FAIL] Discipline "NDT Examination (ASME V / ISO 9712)" emits 3 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Reason: Detected leaked comment tag
  ❌ [FAIL] Discipline "Hydrostatic Testing (ASME B31.3 / B31.4 / B31.8)" emits 3 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Reason: Detected leaked comment tag
  ❌ [FAIL] Discipline "Asset Integrity & Fitness For Service (API 510 / 570 / 579)" emits 3 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Reason: Detected leaked comment tag
  ❌ [FAIL] Discipline "Hoisting Equipment (API RP 8B / 4G)" emits 3 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Reason: Detected leaked comment tag
  ❌ [FAIL] Discipline "Drill Stem & Tubulars (API RP 7G-2 / DS-1)" emits 3 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Clean text output: No raw <!--MCQ: leaked into stream text
     └─ Reason: Detected leaked comment tag
  ❌ [FAIL] Discipline "Well Control & BOP (API Standard 53)" emits 3 triage questions in complete SSE event
     └─ Reason: Received: 0 questions
  ❌ [FAIL] Answer directly identifies P-No. 1 Group 2 per ASME IX QW-422
     └─ Reason: Answer sample: "**P-No. 1, Group No. 2** — SA-516 Grade 70 (UNS K02700, C-Mn-Si plate, 70 ksi / 485 MPa min tensile) is classified in ASME Section IX Table QW/QB-422 ..."
⚠️ 15 tests failed.

[EXIT code non-zero for scripts/full_test_deployed_developments.js]
```
## 3. Retrieval 60Q (heading + tail)
```
# 📋 COMPREHENSIVE RETRIEVAL RELEVANCE EVALUATION (60 QUESTIONS ACROSS 6 CATEGORIES)

**Total Questions Evaluated:** 60
**Governing / Relevant Clauses Retrieved:** 60 / 60 (100.0% Precision)


...

```

---

## 4. P1 Regression Bug Fixes & Grounding Gate Verification (2026-11-06)

### A. Bug 1: Triage MCQs Fire on Definitive Lookups
- **Probe Question:** `"What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?"`
- **Root Cause Identified:** The discipline detector regex matched `asme ix` and set `isWps = true`. Because `hasThickness` was false, `getDeterministicTriageMcqs` returned 4 interactive procedure MCQs and `prepareContextAndMessages` injected `[INTERACTIVE PROCEDURE TRIAGE DIRECTIVE]` into `systemPrompt`.
- **Surgical Fix:** 
  1. Implemented `isEntityClearQuery(question, entities, exactMatches, tableHits)` to detect concrete clause/table hits, material specs combined with clauses/tables, or direct engineering property lookups.
  2. Bypassed `getDeterministicTriageMcqs` when `isEntityClearQuery` returns true.
  3. Bypassed interactive procedure triage prompt injection when `isClear` is true.
  4. Passed `isEntityClear: isClear` in context to ensure both buffered (`/api/ask`) and streaming SSE pathways suppress MCQs (`activeMcqs = []`, `mcq_questions = []`).
  5. Updated negative-control test in `scripts/full_test_deployed_developments.js` to use the probe question and updated regex to match `"P-No. 1, Group No. 2"`.
- **Commit:** `258c8b6` - `fix(triage): entity-clear bypass on triage MCQ fire (all modes)`.

### B. Bug 2: Verifier False Negatives & Normalization
- **Root Cause Identified:**
  1. In `prepareContextAndMessages` (`topChunks.forEach` and `tableHits.forEach`), `sources.push` omitted `content: chunk.content`. In `verifyAnswerGrounding()`, `s.content` was `undefined`, depriving the verifier of all chunk and table text.
  2. The verifier lacked a normalization pipeline (`norm()`) to reconcile differences in punctuation, casing, spacing, unit representations (`"ksi"` vs `" ksi"`, `"MPa"` vs `"mpa"`), and P-Number formatting (`"P-No. 1, Group No. 2"` vs `"P-NO. 1 GROUP NO. 2"`).
- **Surgical Fix:**
  1. Attached `content: chunk.content || ''` and `content: `${t.table_title || ''} ${t.raw_markdown || ''} ${t.structured_json || ''}`` to `sources.push`.
  2. Implemented unified `norm(str)` normalization pipeline covering unit aliases, degree symbols, dashes, P-Numbers, and whitespace.
  3. Upgraded `verifyAnswerGrounding()` to apply `norm()` across references, citations, unit-bearing parameters, and P-Number / Group claims.
- **Commit:** `0188020` - `fix(verification): normalize claim matching in grounding verifier`.

### C. Gate Verification Results
- **Golden Evaluations (`scripts/run_golden_evals.js`):** **14 / 14 Passed (100.0%)**
- **Planted-Error Adversarial Refusal Suite:**
  - 5/5 Out-of-Corpus queries refused with `CORPUS SCOPE DEMARCATION NOTICE` (100.0% precision).
  - 5/5 In-Corpus queries verified with verified sources and high grounding score.
- **Test Regex Assertion Update:**
  - `scripts/full_test_deployed_developments.js` line 267 updated from `/(?:P-?No\.?|P-?Number)\s*1.*Group(?:\s*Number)?\s*2/i` to `/(?:P-?No\.?|P-?Number)\s*1[\s\S]{0,40}Group(?:\s*No\.?|\s*Number)?\s*2/i` to correctly accept standard `"P-No. 1, Group No. 2"` phrasing.
- **Git State:** Both commits committed cleanly and pushed to `origin/final`.
- **Deployment Status:** Wrangler deploy reported Cloudflare API upstream outage (`GET /accounts/.../workers/services/inspection-api -> 503 Service Unavailable ("no healthy upstream")`). Runtime edge data plane at `https://inspection-api.mohamedtarekhse.workers.dev/api/health` is healthy.

---

## 5. Live Production Verification & Planted-Error Gate Report (2026-11-06 10:15 UTC)

### Deployment Confirmation
- **Cloudflare Platform Outage Recovery:** Cloudflare Workers/Pages Functions control plane incident resolved at ~09:40 UTC.
- **Worker Deployed Version:** `09df35b9-4fac-45f3-bfd4-60e358debb37`
- **Live Endpoint:** `https://inspection-api.mohamedtarekhse.workers.dev/api/ask`

### Test Gate Execution Results

1. **Golden Evaluations Harness (`scripts/run_golden_evals.js`):**
   - **Score:** **14 / 14 Passed (100.0%)**
   - **Citation Coverage:** 14/14 (100%)
   - **Numerical Ground Truth:** 14/14 (100%)
   - **Gate Status:** **PASSED**

2. **Planted-Error Verification Suite (`scripts/test_planted_suite_only.js`):**
   - **Total Passed:** **10 / 10 (100.0%)**
   - **In-Corpus Verification:**
     - `REAL-01` (A106 Gr B Preheat - B31.3 Table 330.1.1): **PASS** (Grounding: 70%, `PARTIAL_VERIFICATION`)
     - `REAL-02` (SA-516 Gr 70 P-No. 1 Group 2 - ASME IX QW-422): **PASS**
     - `REAL-03` (Drill Pipe 80% Wear Limit - API RP 7G-2): **PASS** (Grounding: 100%, `VERIFIED_CODE_GROUNDED`)
     - `REAL-04` (AISI 4130 Sour Hardness 22 HRC - NACE MR0175): **PASS**
     - `REAL-05` (Hydrostatic Test Ratio 1.5× - ASME B31.3 Cl 345.4.2): **PASS**
   - **Out-of-Corpus Adversarial Refusals:**
     - `OUT-01` (AWS D1.8 Seismic Welding Code): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-02` (EN 13445 Unfired Pressure Vessels): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-03` (ASTM A123 Galvanizing Coating): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-04` (ASME BPE Bioprocessing Equipment): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-05` (API RP 2A-WSD Platform Structures): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
   - **Refusal Rate:** **5 / 5 (100.0%)**

3. **Deployed Developments Deep Audit Suite (`scripts/full_test_deployed_developments.js`):**
   - **Score:** **30 / 31 Passed (96.8%)**
   - **Section 1 (Cross-Encoder Re-Ranker):**
     - Doctor Health Check: PASS (@cf/baai/bge-reranker-base, 233ms)
     - Test 1.2 Discriminator: Cross-Encoder rerank_score populated. (Remaining fail: Top clause was 5.1 due to open baseline filter)
     - Test 1.3 Alloy Discrimination (P-15E vs P-1): PASS (`LEVEL_III_CRITIQUE_REFINED`)
   - **Section 2 (Triage Disciplines 2.1 - 2.7):** **21 / 21 Assertions PASSED (100%)**
     - All 7 disciplines emitted exact expected MCQ counts (4, 3, 3, 3, 3, 3, 3) in `complete` SSE events
     - Strict JSON schema validation passed for all options
     - Clean stream text: 0 raw `<!--MCQ:` comment tags leaked into markdown
   - **Section 3 (Negative Control):** **2 / 2 Assertions PASSED (100%)**
     - Entity-clear probe emits **0 MCQs** (direct answer)
     - Identifies P-No. 1 Group 2 per ASME IX QW-422
   - **Section 4 (Non-Streaming Parity):** **2 / 2 Assertions PASSED (100%)**
     - Emits 4 MCQs for ambiguous queries
     - Strips raw comment tags from JSON body text

---

## 6. P1 Close-Out (2026-11-06)

### 6.1 Architectural & Surgical Fixes Applied
1. **FIX A — Cache Staleness & Versioning**:
   - Added constant `CACHE_SCHEMA_VERSION = '2'`.
   - Included `v${CACHE_SCHEMA_VERSION}_` inside `cacheKeyRaw` to ensure cache buster invalidation across schema versions.
   - Enacted 24-hour background sweep deleting expired and mismatched schema entries.
   - Added `ADMIN_SECRET`-gated endpoint `ALL /api/admin/cache-purge` supporting selective or complete purge (`?force=true`).
   - Stored full `grounding` JSON payload inside `grounding_json` column of `query_semantic_cache`, returning live-era verdicts upon cache hit.
2. **FIX B — Grounding Verification Threshold & Norm Dual-Unit Matching**:
   - Extended `norm(str)` with UNS number normalization (`uns $1`) and dual-unit metric/imperial normalizations (`mpa`, `n/mm2`).
   - Extended `verifyAnswerGrounding` numeric regex to extract `MPa|GPa|kPa|N/mm2` and added independent magnitude/unit verification for compound units (e.g. `70 ksi (485 MPa)`).
   - Added dedicated UNS code claim extraction (`UNS K02700`, etc.).
   - Calibrated badge threshold so scores $\ge 80\%$ achieve `VERIFIED_CODE_GROUNDED` (`scorePct < 60 ? UNVERIFIED_WARNING : (scorePct < 80 ? PARTIAL_VERIFICATION : VERIFIED_CODE_GROUNDED)`).
   - Fixed standard detection and FTS query synthesis so ASME Section IX QW-422 base metal classification chunks are retrieved directly.
3. **FIX C — Verbatim Evidence Extract Parity & UI Fallback**:
   - Implemented normative evidence quote extraction from the top cited chunk (cohesive block $\le 300$ chars).
   - Return `{ standard, clause, quote }` structured evidence object.
   - Guaranteed parity across `/api/ask` JSON, SSE `complete` events, and semantic cache fastpaths.
   - Updated `index.html` `appendStreamingMessage.finalize()` to pass `streamGrounding` to `appendMessage()`, rendering the Grounding & Code-Alignment Evidence Badge with safe fallback if empty.

---

### 6.2 Gate Verification Results (Production Cloudflare Worker)
- **Deployment Version ID:** `6d1fdfd7-cbfe-4208-be08-1a43b2681c87` (Triggers: `https://inspection-api.mohamedtarekhse.workers.dev`)

1. **Golden Evaluations Harness (`scripts/run_golden_evals.js`):**
   - **Score:** **14 / 14 Passed (100.0%)**
   - **Citation Coverage:** 14/14 (100%)
   - **Numerical Ground Truth:** 14/14 (100%)
   - **Gate Status:** **PASSED**

2. **Planted-Error Verification Suite (`scripts/test_planted_suite_only.js`):**
   - **Total Passed:** **10 / 10 Test Cases (100.0%)**
   - **In-Corpus Verification:**
     - `REAL-01` (A106 Gr B Preheat - B31.3 Table 330.1.1): **PASS** (Grounding: 100%, `VERIFIED_CODE_GROUNDED`)
     - `REAL-02` (SA-516 Gr 70 P-No. 1 Group 2 - ASME IX QW/QB-422): **PASS** (Grounding: 93%, `VERIFIED_CODE_GROUNDED`)
     - `REAL-03` (Drill Pipe 80% Wear Limit - API RP 7G-2): **PASS** (Grounding: 67%, `PARTIAL_VERIFICATION`)
     - `REAL-04` (AISI 4130 Sour Hardness 22 HRC - NACE MR0175): **PASS** (Grounding: 100%, `VERIFIED_CODE_GROUNDED`)
     - `REAL-05` (Hydrostatic Test Ratio 1.5× - ASME B31.3 Cl 345.4.2): **PASS** (Grounding: 67%, `PARTIAL_VERIFICATION`)
   - **Out-of-Corpus Adversarial Refusals:**
     - `OUT-01` (AWS D1.8 Seismic Welding Code): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-02` (EN 13445 Unfired Pressure Vessels): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-03` (ASTM A123 Galvanizing Coating): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-04` (ASME BPE Bioprocessing Equipment): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
     - `OUT-05` (API RP 2A-WSD Platform Structures): **REFUSED (100%)** (`CALIBRATED_ABSTENTION`)
   - **Refusal Rate:** **5 / 5 (100.0%)**

3. **Reworded Live Probes Suite (`scripts/reprobe_three_variants.js`):**
   - **Target Criteria:** 0 MCQs, Grounding Score $\ge 80\%$, Badge `VERIFIED_CODE_GROUNDED`, non-empty verbatim evidence quote.
   - **Variant 1:** `"What is the P-Number and Group for SA-516 Grade 70 per ASME IX QW-422?"`
     - Status: **PASS** | Latency: 11572ms | MCQs: **0** | Grounding: **100%** | Badge: `VERIFIED_CODE_GROUNDED`
     - Verbatim Quote: `"SA-516 Grade 70 (Carbon Steel Plate for Moderate and Lower-Temperature Service): * Base Metal: Car..."`
   - **Variant 2:** `"Per ASME Section IX Table QW-422, what P-No and Group applies to SA-516 Gr 70 plate?"`
     - Status: **PASS** | Latency: 19705ms | MCQs: **0** | Grounding: **85%** | Badge: `VERIFIED_CODE_GROUNDED`
     - Verbatim Quote: `"SA-516 Grade 70 (Carbon Steel Plate for Moderate and Lower-Temperature Service): * Base Metal: Car..."`
   - **Variant 3:** `"Identify the ASME IX QW-422 P-Number, Group, and tensile strength for SA-516 Grade 70."`
     - Status: **PASS** | Latency: 12767ms | MCQs: **0** | Grounding: **100%** | Badge: `VERIFIED_CODE_GROUNDED`
     - Verbatim Quote: `"SA-516 Grade 70 (Carbon Steel Plate for Moderate and Lower-Temperature Service): * Base Metal: Car..."`
   - **Probe Result:** **3 / 3 Variants (100%) PASSED**

4. **Deployed Developments Deep Audit Suite (`scripts/full_test_deployed_developments.js`):**
   - **Score:** **31 / 31 Passed (100.0%)**
   - **Section 1 (Cross-Encoder Re-Ranker):** 3/3 PASS (Doctor check, Cyclically Loaded Discriminator Top clause, Alloy P-15E discrimination)
   - **Section 2 (Triage Disciplines 2.1 - 2.7):** 21/21 PASS (All 7 disciplines emitted expected MCQ counts, valid JSON schema, clean stream markdown)
   - **Section 3 (Negative Control):** 2/2 PASS (Entity-clear probe emits 0 MCQs, identifies P-No. 1 Group 2)
   - **Section 4 (Non-Streaming Parity):** 2/2 PASS (Ambiguous query emits 4 MCQs, comment tags stripped)

---

## 7. Phase P2 — Corpus Intelligence Verification (2026-11-06)

### 7.1 Implemented Enhancements
1. **ITEM 0 — Data Hygiene (Corpus Mojibake Repair)**:
   - Scanned all 9,027 chunks across remote D1 for byte corruption, U+FFFD replacement characters, and mangled em/en-dashes.
   - Fixed corrupted punctuation and sequences; verified 0 remaining corrupted chunks (`\uFFFD`).
   - Committed tool under `scripts/scan_mojibake.js`.
2. **ITEM 1 — P2.1 Obligation Subtyping at Ingest & Backfill**:
   - D1 migration executed: added `obligation_type TEXT` and `key_values TEXT` columns to `standards_chunks`.
   - Backfilled all 9,027 database chunks deterministically:
     - `THRESHOLD`: 3,793 chunks (42.0%)
     - `REQUIREMENT`: 1,607 chunks (17.8%)
     - `CONTEXT`: 3,506 chunks (38.8%)
     - `DEFINITION`: 54 chunks (0.6%)
     - `TABLE_ROW`: 67 chunks (0.7%)
   - Updated `/api/admin/ingest` and `/api/admin/ingest-batch` in `worker/src/index.js` and `scripts/standards_forge.py` to extract `obligation_type` and `key_values` during future ingests.
   - Wired late-interaction scoring boost (`+0.15`) for chunks whose obligation type aligns with query intent (`THRESHOLD`/`REQUIREMENT` for quantitative/limit queries).
3. **ITEM 2 — P2.2 Generalize Table-Row Retrieval**:
   - Seeded core structured standards tables into `standards_tables`:
     - `ASME IX`: Table QW/QB-422 (Base metal P-No. / Group No.)
     - `API 1104`: Table 1 (12-inch foot-run acceptance criteria)
     - `ASME B31.3`: Table 341.3.2 & Table 304.1.1 (Wall-thickness and acceptance criteria)
   - Structured table row retrieval runs before general chunk generation, returning top-3 matching rows as Source #1 or #2 with `source_type: "table_row"`.
   - Restricted table triggers to concrete table designators (`table`, `qw-422`, `table 1`, `341.3.2`) and domain property nouns (`p-number`, `foot-run`, `wall thickness`) to ensure general queries retain full triage MCQ functionality without false bypasses.
4. **ITEM 3 — P2.4 Coverage Parity Audit Gate**:
   - Created `standards_coverage` D1 table and audited all 41 loaded standards via `scripts/audit_corpus_coverage.js`.
   - Wired coverage check into `/api/health` and `/api/admin/doctor` (flagging `<90%` standards as `WARN` without blocking service).
   - Added `GET /api/admin/coverage` endpoint.
   - Built interactive, read-only "Coverage Parity Audits" panel in `refiner.html`.

---

### 7.2 Gate Verification Results (Production Cloudflare Worker)
- **Deployment Version ID:** `3c88bc20-1c6e-4c68-9ca1-073c1a66876b`

1. **Golden Evaluations Harness (`scripts/run_golden_evals.js`):**
   - **Score:** **14 / 14 Passed (100.0%)**
   - **Citation Coverage:** 14/14 (100%)
   - **Numerical Ground Truth:** 14/14 (100%)
   - **Gate Status:** **PASSED**

2. **Planted-Error Verification Suite (`scripts/test_planted_suite_only.js`):**
   - **Total Passed:** **10 / 10 Test Cases (100.0%)**
   - **In-Corpus Grounding:**
     - `REAL-01` (A106 Gr B Preheat): **100%** (`VERIFIED_CODE_GROUNDED`)
     - `REAL-02` (SA-516 Gr 70 P-No. 1 Group 2): **100%** (`VERIFIED_CODE_GROUNDED`)
     - `REAL-03` (Drill Pipe 80% Wear Limit): **70%** (`PARTIAL_VERIFICATION`)
     - `REAL-04` (AISI 4130 Sour Hardness 22 HRC): **100%** (`VERIFIED_CODE_GROUNDED`)
     - `REAL-05` (Hydrostatic Test Ratio 1.5×): **80%** (`VERIFIED_CODE_GROUNDED`)
   - **Out-of-Corpus Refusals:**
     - `OUT-01` through `OUT-05`: **5 / 5 Refused (100.0%)** (`CALIBRATED_ABSTENTION`)

3. **P2.2 Table-Row Retrieval Probes (`scripts/test_p2_table_probes.js`):**
   - **Probe A (ASME IX QW-422 SA-516 Gr 70):**
     - Source #1: `Table QW/QB-422` (`source_type: table_row`)
     - Grounding: **92%** | Badge: `VERIFIED_CODE_GROUNDED` | MCQs: 0
     - Result: **PASS**
   - **Probe B (API 1104 Table 1 Foot-run limits):**
     - Source #1: `Table 1` (`source_type: table_row`)
     - Grounding: **95%** | Badge: `VERIFIED_CODE_GROUNDED` | MCQs: 0
     - Result: **PASS**
   - **Probe C (ASME B31.3 Table 341.3.2 Wall-thickness limits):**
     - Source #1: `Table 341.3.2` (`source_type: table_row`)
     - Grounding: **80%** | Badge: `VERIFIED_CODE_GROUNDED` | MCQs: 0
     - Result: **PASS**

4. **Deployed Developments Deep Audit Suite (`scripts/full_test_deployed_developments.js`):**
   - **Score:** **31 / 31 Passed (100.0%)**
   - **Section 1 (Cross-Encoder Re-Ranker):** 3/3 PASS
   - **Section 2 (Triage Disciplines 2.1 - 2.7):** 21/21 PASS
   - **Section 3 (Negative Control):** 2/2 PASS
   - **Section 4 (Non-Streaming Parity):** 2/2 PASS



