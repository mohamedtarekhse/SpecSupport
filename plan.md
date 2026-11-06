# SpecSupport (Inspecta) — Master Improvement Plan

> **Plan version:** 2.0 — **Last updated:** 2026-11-05
> **Sources of truth:**
> 1. `FULL_CONVERSATION_HISTORY.md` (242-turn development log)
> 2. `context.md` — Master Technical Specification v2.6.0-Enterprise (dual-pass loop engineering, triage engine, LocaSpec offline, CI/CD gates)
> 3. Actual codebase audit (`worker/src/index.js`, `scripts/`, `docs/`)
> 4. Competitive/technical research: Harvey, OpenEvidence, Anthropic Citations, Vectara HHEM, Bespoke MiniCheck, LettuceDetect, Groundkit, Conformal-RAG (C-RAG/TRAQ), standrdX, NDTVerify, ComplAI, Satori
> **This is the single plan of record.** Supersedes loose notes in `docs/` and `what should we do/`.

**System facts (v2.6.0-Enterprise, branch `final`):**
- Edge: Cloudflare Workers (Hono, ~6,100 lines) + D1 (`inspection-db`, 9,025 chunks / 41 standards / 8 tables) + Workers AI.
- Frontend: `index.html` SPA (~10,500 lines), PWA (`sw.js` network-first), LocaSpec IndexedDB offline engine, voice input, KaTeX, WPS Form QW-482 generator.
- Providers: CF Workers AI (GLM 5.3 / Llama 3.3 70B) → Groq (Llama 3.3 70B Versatile) → OpenRouter (Nemotron) circuit-breaker cascade.
- Retrieval: 3-tier hybrid — FTS5 BM25 ∥ 384-dim dense (`@cf/baai/bge-small-en-v1.5`) ∥ cross-encoder re-rank (`@cf/baai/bge-reranker-base`, top-10).
- Verification: Draft LLM → **Level III Critic Agent** validating against `code_safety_envelopes` (metallurgical physics: preheat, interpass, PWHT, hardness for P-No 1–15E, API 5L, Inconel).
- Elicitation: `getDeterministicTriageMcqs()` — schema-typed JSON MCQs across 7 disciplines (Welding, NDT, Hydrotest, Integrity/FFS, Hoisting, Tubulars, Well Control).
- CI/CD: `ci_cd_loop3_deploy.js` blocks deploy <100% on Golden-14; 31-test suite (`full_test_deployed_developments.js`); 60-query retrieval eval; `scheduled_final_gate`.

---

## 0. Product Identity & Non-Negotiable Principles

**Inspecta** = critical-time QA/QC decision assistant for O&G inspectors (upstream / midstream / downstream). The user is on a rig floor or a supplier shop and needs **one correct number and one correct clause in seconds** — sometimes with zero connectivity.

| # | Promise | Engineering meaning |
|---|---|---|
| 1 | **No hallucination** | Every number, clause, and table reference must be verifiably traceable to a retrieved chunk or a `code_safety_envelopes` row. Unverifiable = stripped/flagged, never shipped silently. |
| 2 | **Direct answer** | Direct Answer → Evidence Quote → Explanation. The 4 Rosetta pillars already encode this (Scope Guard → Verbatim Rejection Limits → Normative Bridge → QA Audit Matrix). Keep it, tighten it. |
| 3 | **Minimum words** | Shortest defensible answer. No mandatory bolt-on sections, no preamble (Pillar 2 mandates zero-conversational-preamble — enforce it). |
| 4 | **Fast, because critical** | Sub-5 s full answer, sub-1.5 s first useful word; instant path for entity-clear lookups. Same promises offline via LocaSpec. |

**Iron rule:** no coverage → refuse ("outside your loaded corpus / edition X") or triage-MCQ. Never guess, never hedge. This is already partially implemented (negative controls in the 31-test suite) — this plan makes it **guaranteed and measurable**.

---

## 1. Current State — what exists and is protected

Already built (do not re-build; verify + tighten only):
- 3-tier hybrid retrieval + reranker; HyDE cache; exact-clause hoisting; taxonomy scope-guard injection (prohibited codes).
- **Dual-Pass Loop Engineering**: Draft → Level III Critic with `code_safety_envelopes` physics validation — this is a real differentiator vs generic RAG.
- **Deterministic Triage Engine**: typed JSON MCQ chips, 7 disciplines, embedded in SSE `complete` payload.
- Ingestion: breadcrumb chunking, layout-preserving extraction, Table-to-JSON, SHA-256 dedup, Refiner Studio, `standard_code` normalization (defrag), boilerplate scrubbing, embedding backfill/audit scripts.
- Data protections: D1 50 MB payload guard (`LIMIT 80`), SQLite 100-variable guard, SW extension-protocol guard, multi-provider circuit breaker.
- CI/CD eval infrastructure: Golden-14 deploy gate, 31-test suite, 60-Q retrieval audit, scheduled final gate, accuracy audit script.
- LocaSpec offline: PWA + IndexedDB (6,000+ chunk bundles) + client-side semantic match + air-gapped rig-server (Docker Ollama + Nginx).

## 1b. Known Defects / Open Risks (from history + code + context cross-check)

1. **No post-output alignment verification.** The Critic Agent validates drafts against `code_safety_envelopes` — metallurgical physics only. It does **not** verify that every number/clause the answer states actually exists in the retrieved chunks or envelope rows. Numbers outside welding/heating (wear %, wall thickness, pit depth, hydrotest pressure, NDT sensitivity) have **no mechanical verifier**. This is the remaining hallucination surface.
2. `canAttemptProvider` / `recordProviderFailure` / `recordProviderSuccess` — **verify whether still undefined** in `askAIProvider` (history Turn 242 carry-forward; may have been fixed since). Fix if ReferenceError persists.
3. `OPENROUTER_MODEL` may still point to the decommissioned nemotron slug — verify and refresh.
4. Hardened engineering values baked **inside system prompt text** (~line 4554 region: 4130 preheat, 22 HRC) — unauditable "prompt-as-database"; move into `code_safety_envelopes` + chunks with citations.
5. **10k neurons/day free-tier ceiling** — every query spends HyDE + embedding + rerank + LLM (locally observed burnout: `4006 daily allocation` errors). Blocks scale.
6. Envelope completeness: `expand_safety_envelopes.sql` covers P-8/P-15E/API 5L/Inconel additions; P-1 groups (e.g., SA-516 Gr 70 → P1/G2) and line-pipe grades need full census — proven by the QW/QB-422 cold-spot bug.
7. Edit-gating: no edition/revision column in `standards_chunks` (v2.6 schema has none) → cross-edition clause-number collisions possible.
8. Ingest throughput: batched/resumable chunk upload still missing (serial 120–180 roundtrips).
9. Self-graded evals: Golden-14/31-test are aligned with the corpus by design — no independent holdout; scores can drift toward over-fitting.
10. LocaSpec sync integrity is asserted in docs but has **no offline-vs-online parity test suite**.
11. Monolith risk: 6,100-line worker + 10,500-line `index.html` — every prompt/UI edit risks cross-mode regressions.
12. No request traces: per-request retrieval scores, verifier verdicts, latency stages are not persisted → accuracy fixes stay opinion-driven.

---

## 2. Gap Analysis — grouped, with what's NEW vs research findings

### A. Trust & anti-hallucination (the decisive gap — ranked by ROI)
| Gap | Reference / who does it | Status |
|---|---|---|
| **A1. Deterministic post-generation grounding verifier** — regex/segment match every number/clause/citation in the final answer against retrieved chunks + envelope rows; strip or ⚠-flag non-matching spans | Groundkit, CiteGuard-RAG, Anthropic Citations (`cited_text` string-match) | ❌ Missing — Critic covers physics, not verbatim grounding |
| **A2. Calibrated abstention gate** — refuse/clarify when rerank top-score below threshold calibrated on holdout (target: ≥90% of accepted answers grounded) | OpenEvidence behavior; conformal-RAG (C-RAG, TRAQ, selective-RAG) | ❌ Missing — negative controls exist in tests, not at runtime |
| **A3. Evidence-quote verifiable badge** — model must return `evidence_quote` verbatim substring of a chunk; UI shows Verbatim ✓/✗ | Anthropic Citations API | ❌ Missing |
| **A4. Independent holdout golden set** (30–50 Q per major standard, never used to tune DB, graded by second model path or local MiniCheck) | Harvey BigLaw Bench methodology | ❌ Missing — replace self-grading |
| **A5. Planted-error suite** — 5 real + 5 out-of-corpus questions each deploy; refuse-rate on out-of-corpus must be 100% | selective-RAG / conformal abstention practice | ❌ Missing |
| **A6. Edition/revision anchoring** — `edition` column on chunks; answer header states edition; mixed-edition → clarify | LexisNexis "ольш Shepardize" validity concept | ❌ Missing (schema gap) |
| **A7. Selective per-claim Critic for non-envelope numbers** (wear%, thickness, hydrotest) — extend dual-pass Critic domains beyond metallurgy | Harvey claim decomposition, GANDR | ⚠ Partial — Critic exists but only for weld/heat-treat physics |
| **A8. MiniCheck/HHEM/LettuceDetect as offline eval grader** (never in request path) | Bespoke MiniCheck (SOTA 0.4–7B grounding checker), Vectara HHEM-2.1-Open, LettuceDetect | ❌ Missing — easy to add to `.eval_history` tooling |

### B. Corpus retrieval intelligence (the 80% root-cause layer)
| Gap | Status |
|---|---|
| **B1. Obligation typing enrichment**: v2.6 has 4 null `pillar_type` values (SCOPE_DEMARCATION, DISCARD_LIMITS, NORMATIVE_REFS, QA_AUDIT_DOCS). Missing: REQUIREMENT / THRESHOLD / TABLE_ROW / DEFINITION subtyping + full census for every chunk. | ⚠ Partial (scaffold exists, not enforced at ingest) |
| **B2. Table row-level retrieval** — land queries directly on table JSON rows (QW/QB-422, acceptance tables) as rank-1 exact hits | ⚠ Partial (QW/QB-422 done for ASME IX; not generalized) |
| **B3. Addendum–override hierarchy** (project spec > addendum > code), governing layer stated in the answer | ❌ Missing |
| **B4. Coverage parity audit ≥95% per ingest** (recorded in `standards_verification_reports`) | ⚠ Partial |
| **B5. Migrate prompt-hardcoded engineering values → envelope rows + cited chunks** | ❌ Missing |
| **B6. Curated atomic answer units** (per cold-start direct hit; precompiled clause + numbers + dual units) | ❌ Missing |

### C. Speed & cost
| Gap | Status |
|---|---|
| **C1. Skip-HyDE routing** on `extractAlphanumericEntities()` hits → 0 neurons for exact lookups | ❌ Missing |
| **C2. Parallelize retrieval legs** (FTS ∥ vector ∥ taxonomy) | ⚠ Verify |
| **C3. Query-answer semantic cache** (normalized-question hash; invalidated on DB version) | ❌ Missing (only HyDE cache exists) |
| **C4. Neuron ceiling decision**: paid plan OR aggressive caching + CF→Groq shifting | ❌ Open decision |
| **C5. Batched/resumable ingest** (25–45 s → seconds) | ❌ Missing |
| **C6. Per-mode `max_tokens` caps** (lookup ~900, deep ~2200) | ❌ Single value today |

### D. Output contract & UI
| Gap | Status |
|---|---|
| **D1. Structured JSON answer payload** (answer / evidence / standard / clause / explanation / followups) — the triage MCQs are already JSON; extend to the full answer body → no more regex tail parsing | ❌ Missing (largest UI debt) |
| **D2. Answer-first streaming** — direct answer streams, explanation/tables stream after | ⚠ Partial (SSE exists; order isn't prioritized) |
| **D3. Comparisons / Delta Matrix opt-in (default off)** | ❌ Missing |
| **D4. Break index.html into modules** (chat, notebook sidebar, LocaSpec, WPS form, exporter) | ❌ Missing |

### E. Offline & platform (LocaSpec / rig)
| Gap | Status |
|---|---|
| **E1. Offline parity suite** — LocaSpec answers vs online answers cross-validated on 20 golden questions | ❌ Missing |
| **E2. Sync integrity medals/monitors** — chunk count/versioned DST expiry, conflict resolution | ⚠ Unverified |
| **E3. Rig-server Ollama model parity policy** — which local model is certified vs cloud (accuracy differs) | ❌ Missing |
| **E4. Auth + per-user feedback → teaching loop** (👍/👎 exists, no accounts) | ❌ Missing |
| **E5. Request traces** (retrieval scores, verifier verdicts, latency stages → D1) | ❌ Missing |
| **E6. Unit tests for table parser / entity extractor / RRF / verifier** | ❌ Missing |
| **E7. Image/vision crack+pitting sizing** | ❌ Planned only |
| **E8. Web fallback with trusted whitelist + UNVERIFIED tags** | ⚠ Partial |
| **E9. Expert community / mini-LinkedIn** | ❌ Planned only |

---

## 3. Roadmap — Phased with Gates

> Effort: S ≤1 day, M 2–4 days, L 1–2 weeks. P0–P3 = core (hallucination · directness · speed · offline).
>
> **✅ STATUS (2026-11-06):** P0 done. **P1 CLOSED — live-verified:** golden 14/14 · deep audit 31/31 · planted-error 10/10 (refusal 5/5) · holdout 96.7% · SA-516 probe = 100% VERIFIED (11/11 claims) · cache-hit parity confirmed (346 ms). **Phase P2 Corpus Intelligence & Batch B live-verified:** P2.0 Mojibake repair (0 corrupted chunks remaining) · P2.1 Obligation subtyping & backfill (9,027 chunks typed, +0.15 retrieval boost) · P2.2 Generalize table-row retrieval (ASME IX QW-422, API 1104 Table 1, ASME B31.3 Table 341.3.2 seeded & verified as Source #1) · P2.3 Addendum precedence · P2.4 Coverage parity audit (standards_coverage D1 table, /api/health WARN, Refiner panel) · P2.5 Edition anchoring · **P2.6 Envelope census** (15 canonical envelopes, REAL-03 90% / REAL-05 100% VERIFIED) · **P3.1 Deterministic table fast-path** (P50 626ms cold / 140ms cached, 0 LLM calls) · P3.4/P3.5/P3.6 (caps, opt-in comparisons, semantic cache + version keys). Next active: P3.2–P3.3.

### Phase P0 — "Stop the bleeding" (1 week)
| # | Task | Effort | Acceptance gate |
|---|---|---|---|
| P0.1 | **Verify (then fix if needed)** `canAttemptProvider` / `recordProviderFailure` / `recordProviderSuccess` in `askAIProvider`; run circuit-breaker cascade test | S | Failover actually engages; ReferenceError masked-as-429 gone |
| P0.2 | Refresh `OPENROUTER_MODEL` to live slug; verify each provider | S | No dead-slug hits |
| P0.3 | Migrate prompt-hardcoded engineering values into `code_safety_envelopes` + cited chunks; delete from prompt | M | Golden-14 + 31-test all-PASS (≤0 regressions) |
| P0.4 | Neuron emergency bridge — (a) skip-HyDE on entity hits, (b) query-embedding cache table (normalized question hash) | M | Exact-lookups cost 0 retrieval neurons; doctor-check all-PASS |
| P0.5 | Add **planted-error suite v1** (5 real + 5 out-of-corpus) wired into `full_test_deployed_developments.js` | S | Out-of-corpus refusal ≥80% now (target: 100% after P1.2) |

**P0 exit gate:** doctor all-PASS + golden-14 + 31-test + planted-error v1 recorded in `.eval_history/FINAL_GATE_REPORT.md`.

### Phase P1 — "Grounding verification layer" (1–2 weeks) ⭐ Highest value
Goal: extend the existing dual-pass Critic from physics-only to **verbatim output alignment**; make refusal guaranteed.
| # | Task | Effort | Acceptance gate |
|---|---|---|---|
| P1.1 | **Deterministic grounding verifier** after the Critic pass: extract every numeric/clause/string claim from the final answer → match against retrieved chunk text + envelope rows; strip/flag unmatched spans | M | Zero fabricated-number escapes on planted-error suite; catch-rate ≥80% |
| P1.2 | **Calibrated abstention gate** (strict mode): below rerank/calibrated threshold → refuse or triage-MCQ only | S | Refusal-when-out-of-corpus = 100% on planted-error suite; groundedness of accepted answers ≥90% (holdout-calibrated) |
| P1.3 | **Evidence-quote badge**: mandatory `evidence_quote` verbatim substring of a chunk; UI shows Verbatim ✓ / not verifiable ✗ chip | S | Badge renders + verified in 31-test |
| P1.4 | **Independent holdout set** (30–50 Q per top-10 standards; never used in tuning; graded by second model path or local MiniCheck) | M | Holdout score published as the trust metric |
| P1.5 | **Per-request traces** into D1 `request_traces` (retrieval scores, verifier verdicts, stage latency) | S | Trace visible in Refiner Studio |
| P1.6 | **MiniCheck/HHEM offline grader** wired to eval scripts for every deploy report | S | Deploy reports show independent grounding score |

**P1 exit gate:** planted-error refuse-100% + 0 fabricated escapes + holdout ≥90% grounded + golden/31-test PASS.

### Phase P2 — "Corpus intelligence" (parallel with P1)
Goal: attack retrieval failures — the true 80% root cause.
| # | Task | Effort |
|---|---|---|
| P2.1 | Obligation subtype enforcement at ingest (REQUIREMENT/THRESHOLD/TABLE_ROW/DEFINITION) building on existing `pillar_type` | M |
| P2.2 | Generalize table row-level retrieval beyond QW/QB-422 to all `standards_tables` rows | M |
| P2.3 | Addendum–override hierarchy; answer states governing layer (company spec > addendum > code) | M |
| P2.4 | Coverage parity audit ≥95% per ingest wired to gate | M |
| P2.5 | **`edition` column + edition anchoring** in chunks and answer headers | M |
| P2.6 | Envelope completeness census: P-Number + group levels across all 41 standards via envelope wipes | M |
| P2.7 | Full re-ingest with typed coverage after 2.1–2.6 are set | L |

**P2 exit gate:** holdout retrieval hit-rate ≥90%; 60-Q retrieval benchmark all-PASS through typed paths; 0 mixed-edition silent answers.

### Phase P3 — "Directness & speed" (1 week)
| # | Task | Effort |
|---|---|---|
| P3.1 | Exact-lookup fast path (entity extraction → SQL hoisting → table row → envelope check → answer, no HyDE/LLM pre-step) | M |
| P3.2 | Parallelize FTS ∥ vector ∥ taxonomy retrieval legs | S |
| P3.3 | Answer-first SSE ordering (direct answer streams first, enhanced sections after) | M |
| P3.4 | Per-mode `max_tokens` caps + brevity enforcement (Pillar 2: zero preamble) | S |
| P3.5 | Comparisons/Delta Matrix opt-in (default off) | S |
| P3.6 | Answer-level semantic cache (TTL; invalidated on DB version bump) | M |

**P3 exit gate:** P50 full answer ≤5 s; P50 first visible ≤1.5 s; exact-lookups <2 s and <1 neuron.

### Phase P4 — "Offline first" (LocaSpec hardening) (1–2 weeks)
| # | Task | Effort |
|---|---|---|
| P4.1 | **Offline parity suite**: LocaSpec offline answers cross-validated vs online on a 20-question golden set | M |
| P4.2 | Sync integrity: chunk-count/version handshake; DST/TTL staleness indicator in UI; auto-notify inspector when bundle is stale | M |
| P4.3 | Rig-server model certification: document which local Ollama model is approved (resources + accuracy); parity check script vs cloud results | M |
| P4.4 | Unit tests for offline LocaSpecEngine scoring functions | M |

**P4 exit gate:** offline PASS on 20-Q golden set; staleness warnings proven in tests; no silent divergence.

### Phase P5 — "Platform & product" (backlog, pick by need)
| # | Task | Effort |
|---|---|---|
| P5.1 | Split monoliths: worker into `retrieval / prompts / verify / ingest-admin / eval`; index.html into modules | M |
| P5.2 | Auth + per-user feedback → ndt_rules teaching loop | M |
| P5.3 | Observability dashboard (req traces replay + failure taxonomy dashboard) | M |
| P5.4 | Image/vision crack+pitting sizing (client OpenCV + server vision) | L |
| P5.5 | Web fallback with trusted whitelist + UNVERIFIED tags in strict mode | M |
| P5.6 | Expert community / mini-LinkedIn (Phase-4 plan exists) | L |
| P5.7 | Conformal-RAG upgrade (substitute static thresholds with conformal abstention calibrated per domain — C-RAG/TRAQ) | M |
| P5.8 | Custom fine-tuned model on accumulated traces (Harvey-style) | XL — only after paid tier + 1k+ real traces logged |

> Note: the "Draft → Level III Critic" dual-pass **already exists**. Do NOT rebuild — instead: extend to physics + **verbatim** the grounding verifier at each tier (P1.1) so the two-quarter pass chain is: retrieval guard → draft → Critic (physics) → Verifier (verbatim grounding) → refusal gate → badge.

---

## 4. Quality Gates & Measurement (every deploy)

| Metric | Current | P1 target | P3 target |
|---|---|---|---|
| Golden-14 | 14/14 (self-curated) | holdout set | PASS |
| 31-test audit | 30/31 | 31/31 | 31/31 |
| Retrieval 60-Q | 60/60 | PASS with typed chunks | PASS |
| Planted-error refusal (out-of-corpus) | ungated | 100% | 100% |
| Fabricated-number escapes | ungated | 0 escapes | 0 escapes |
| Accepted-answer groundedness (holdout) | ungated | ≥90% | ≥95% |
| P50 answer latency | ungated | measured | ≤5 s |
| P50 first-visible | ungated | measured | ≤1.5 s |
| Neurons/query (median) | ungated | ≤3 | ≤2 (lookups ≤1) |
| LocaSpec parity | ungated | — | 20/20 |

**Verification philosophy (industry-adopted):**
1. Never self-grade with questions from the same source as the corpus — holdout wins.
2. Verify output, not prompt: the deterministic verifier (P1.1) is authoritative; prompts are guidance.
3. Every deploy requires Golden-14 + planted-error refuse-100% before merge to `final`.
4. Measure, then decide: `.eval_history/` is authoritative over opinions.

---

## 5. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Over-refusal annoying real users | Holdout-calibrated threshold; soft fallback: 1 triage-MCQ → web-mode with UNVERIFIED tag; track abstention rate (<15%) |
| Neuron ceiling block | P0.4 caches + routing; decide paid plan by P3; shift retrieval to client/offline paths |
| GLM schema disobedience (JSON output) | Schema-enforced JSON; 1 retry with smaller model; treat failure as refusal |
| Critic + Verifier double-pass latency | Run Verifier only after Critic; parallelize retrieval legs; both are sub-second deterministic code, not LLM calls |
| LocaSpec diverges silently from online | P4.1 parity gate + version handshake; stale-bundle alerts |
| Envelope table gaps → Critic over-reliance | P2.6 census; verifier flags any number not in envelope rows |
| Bun → prompt-async | Frozen JSON D1 contract; UI template version; e2e regression suite (P5.6) |

---

## 6. Immediate Next Actions (start this week)
1. **P0.1–P0.2** — provider-fallback verification/fix (hours).
2. **P1.1** — deterministic grounding verifier skeleton + run planted-error v1 as feasibility demo (2 days).
3. **P1.2** — calibrated abstention gate on holdout (1 day).
4. **P0.5** — batch ingest in parallel (independent).
5. Run full P0 exit gate + planted-error v1 as feasibility proof for all later efficacy.

> Update this file with empirical numbers at every gate. Metrics replace opinions as sources of truth.
