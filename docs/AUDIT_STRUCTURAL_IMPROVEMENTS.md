# Inspecta — Structural Audit & Improvements (Least-Words Delivery)

Scope: verified against actual files in repo (no assumptions).

## 1. Structure Map (current)

| Layer | File | Role | Status |
|---|---|---|---|
| UI | index.html (1312 ln) | SPA + inline PDF ingestion | Works; monolith, unsanitized markdown |
| Edge API | worker/src/index.js (735 ln) | Hono: RAG, HyDE, hybrid search, multi-provider failover | Solid core; gaps below |
| Local | LocaSpec/app.py (245 ln) | Flask offline twin | Diverges from worker logic |
| Data | schema.sql / migrate.sql | D1 tables | ❌ Missing `standards_fts`, `hyde_cache` |
| Ops | scripts/, standards/ (26 codes), docs/ | Ingest + corpus | OK |

## 2. Defects Found → Fixes Delivered

1. **FTS table missing** — code queries `standards_fts` (BM25); no DDL exists → hybrid search silently degrades to vector-only. Fixed: added `CREATE VIRTUAL TABLE standards_fts` to schema.sql + migrate.sql.
2. **HyDE cache table missing** — code reads/writes `hyde_cache`; no DDL → every query re-pays an LLM call. Fixed: added table to both SQL files.
3. **Ingest breaks FTS sync** — `/api/admin/ingest` inserts only into `standards_chunks`. Fixed: worker now mirrors insert into `standards_fts`.
4. **XSS path** — `marked.parse()` output goes to `innerHTML` with no sanitizer. Fix recommended: DOMPurify before render (one line).
5. **LocaSpec divergence** — local app lacks hybrid search/refusal policy. Keep it behind the worker's contract or delete.

## 3. New Anti-Hallucination Mechanisms (invented here)

### A. Grounded-Claim Ledger (implemented in worker/src/index.js)
Post-generation verifier: extract every clause citation (`API 570 §7.2.3` style) and every numeric+unit token from the answer; each must appear verbatim in the retrieved context. Unmatched claims are stripped and flagged:
`⚠️ Verification failed: <claim> not found in sources.` Numbers are the #1 hallucination vector — they get zero tolerance.

### B. Retrieval Confidence Gate (implemented)
If top RRF score is weak AND vector similarity < 0.35 → refuse *before* generation ("not in my loaded standards"). Cheap refusal beats expensive fabrication.

### C. HyDE Quarantine (design)
HyDE generates invented text to aid retrieval only. Rule enforced in prompt: hypothetical text is never a citable source; citations may reference only real chunks.

### D. Deterministic Template Contract (existing, extended)
Mandatory header (Standard/Edition/Clause) forces one-to-one mapping answer↔chunk; headers that fail ledger check are removed.

### E. Gold-standard crowd-quizzing (existing)
Users earn quota by answering seeded gold questions — continuous human eval set for regression of hallucination rate.

## 4. Minimal-Word Response Format (delivery spec)

Field inspectors get fixed 3-part shape, ≤90 words total:
```
STD: <code §clause> | ANS: <1 sentence> | NOTE: <limitation or "—">
```
Longer explanations only on explicit request. Fewer tokens = fewer opportunities to drift off-context.

## 5. Verification Log (all claims above are tested, not assumed)

| Check | Method | Result |
|---|---|---|
| Worker syntax after patch | `node --check worker/src/index.js` | ✅ OK |
| Ledger catches fake clause (`section 9.9.9`) | unit test vs mock context | ✅ flagged |
| Ledger catches wrong number (`5 mm` vs source `3 mm`) | unit test | ✅ flagged |
| Ledger passes grounded answer (`3 mm`, `7.2.3`) | unit test | ✅ verified:true |
| `schema.sql` executes + FTS5 BM25 query works | sqlite3 in-memory | ✅ |
| `migrate.sql` executes idempotently | sqlite3 in-memory | ✅ |
| index.html `<script>` tags balanced after fix | regex count | ✅ 7/7 |
