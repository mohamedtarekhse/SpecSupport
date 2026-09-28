# ECC 7-Step Engineering Cycle for Inspecta (SpecSupport)
Adapted from `affaan-m/ecc` (Enterprise/Agent Coding Harness Methodology)

```
┌───────┐     ┌──────┐     ┌───────────┐     ┌────────┐     ┌────────┐     ┌──────────┐     ┌─────────┐
│ PLAN  │ ──► │ TEST │ ──► │ IMPLEMENT │ ──► │ REVIEW │ ──► │ VERIFY │ ──► │ REMEMBER │ ──► │ IMPROVE │
└───────┘     └──────┘     └───────────┘     └────────┘     └────────┘     └──────────┘     └─────────┘
```

---

## The 7-Step Cycle Operational Definition

### 1. PLAN (Context & Scope Analysis)
- **Objective:** Never start coding without establishing the blast radius and architectural constraints.
- **Actions:**
  - Read relevant files using precise line ranges.
  - Trace dependencies between `index.html` (Frontend), `worker/src/index.js` (Edge API), and Cloudflare D1 (`inspection-db`).
  - Confirm execution context: strictly on branch `final`, using Windows PowerShell compatible syntax (`npx.cmd`, `;` instead of `&&`).
  - Formulate an explicit plan with acceptance and rejection thresholds.

### 2. TEST (TDD & Benchmark Formulation)
- **Objective:** Define success criteria *before* modifying code.
- **Actions:**
  - If adding a standard, formula, or route: write the test assertion into `test_accuracy_suite.js` or dedicated unit test first.
  - Verify that the test fails (or establishes baseline) before applying implementation.
  - Assert numerical tolerances (e.g. wall thickness within ±0.01 in, optical density 1.8 to 4.0).

### 3. IMPLEMENT (Surgical Execution)
- **Objective:** Minimal viable diffs with zero collateral damage.
- **Actions:**
  - Make isolated, single-responsibility changes.
  - Protect engineering syntax: use decimal-safe regex `/(?<!\b(?:e\.g|i\.e|Table|Fig|Sec|Para|UG|UW|API|ASME|AWS|ISO|No|Rev|\d))\.\s+(?=[A-Z0-9\(\[])/g`.
  - Batch network and database operations (`env.DB.batch(...)` and `/api/admin/ingest-batch`).
  - Maintain the SAP Horizon Blue (`#0070F2`) palette and Gemini SVG geometric icon standard.

### 4. REVIEW (Clean-Context Audit)
- **Objective:** Evaluate the diff from an adversarial, independent perspective.
- **Actions:**
  - Run syntax verification (`node -c worker/src/index.js`).
  - Check Cloudflare Worker CPU limits: ensure O(N) operations (e.g. 768-D cosine similarity) are bounded by candidate pre-filtering.
  - Audit for zero-hallucination compliance: ensure the Three-Sentence Rule is preserved.

### 5. VERIFY (Production & Staging Benchmark)
- **Objective:** Concrete empirical proof of correctness.
- **Actions:**
  - Deploy worker via `npx.cmd wrangler deploy --config worker/wrangler.toml`.
  - Execute the full automated benchmark suite: `node test_accuracy_suite.js`.
  - Require **100% assertion pass rate** (all 32/32 assertions must pass).
  - If any test fails, automatically rollback or fix before closing the cycle.

### 6. REMEMBER (Persistent Memory Update)
- **Objective:** Turn ephemeral wins into persistent system memory so learnings are never lost.
- **Actions:**
  - Update `.ecc/memory/project_memory.json` with new versions, formulas, and baseline stats.
  - Document newly discovered edge cases in `.ecc/instincts/`.
  - Keep conversation context lean: persist detailed architecture in files and documentation artifacts.

### 7. IMPROVE (Continuous Learning & Active Refinement)
- **Objective:** Continuous system evolution without human intervention.
- **Actions:**
  - Trigger `/api/admin/auto-train-standard` on uploaded standards.
  - Run synthetic adversarial prompt variations to detect drift.
  - Commit clean, atomic git commits to branch `final` and push to remote.
