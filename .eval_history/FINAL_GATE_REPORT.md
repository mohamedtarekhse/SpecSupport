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