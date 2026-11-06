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

