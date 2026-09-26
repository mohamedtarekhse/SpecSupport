# How Inspecta Comprehends Engineering Standards & Utilizes AI

Engineering codes in the Oil & Gas, Petrochemical, and Fabrication sectors (API, ASME, AWS, ISO, NACE) represent the highest tier of technical complexity. A generic Large Language Model (LLM) often hallucinates values, quotes retired clauses, or conflates distinct standards (e.g. applying structural welding tolerances from AWS D1.1 to process piping under ASME B31.3).

This document explains the end-to-end artificial intelligence architecture that allows **Inspecta** to comprehend, cross-reference, and reason through engineering standards with deterministic precision.

---

## 1. The Core Engineering Challenge

Engineering specifications differ fundamentally from general conversational knowledge:
1. **Zero-Tolerance for Hallucination**: An error in allowable undercut depth (e.g., specifying 1.5 mm instead of 0.8 mm) can cause catastrophic pipeline rupture or shut down a multimillion-dollar turnaround.
2. **Vocabulary Mismatch**: Field inspectors ask practical questions ("What is the maximum allowable hardness for sour service tubing?"), whereas the standard contains legalistic and metallurgical clauses ("Products manufactured from alloy L-80 shall exhibit a Rockwell C hardness not exceeding 23 HRC per NACE MR0175 Table A.2").
3. **Contradictions Between Jurisdictions**: A pipeline crossing a highway falls under ASME B31.4/B31.8 or API 1104, while adjacent station piping may fall under ASME B31.3. Blending their rules is a critical safety failure.

---

## 2. The Multi-Stage Comprehension Pipeline

Inspecta solves this with a **6-stage Retrieval-Augmented Generation (RAG) Architecture**:

```
[ User Question ]
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Stage 1: HyDE Query Expansion & Context Synthesis      │
│ (Generates hypothetical standard clause via fast LLM)  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Stage 2: Dual Hybrid Retrieval                         │
│ ├─ Dense Vector Search (BGE-Base / all-MiniLM)         │
│ └─ Sparse Keyword Search (SQLite FTS5 BM25)            │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Stage 3: Reciprocal Rank Fusion (RRF)                  │
│ (Merges & re-scores top vector and keyword candidates) │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Stage 4: Dynamic NDT Rules & Filter Injection          │
│ (Injects active jurisdiction and safety overrides)     │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Stage 5: Zero-Contradiction Reasoning Engine           │
│ (Strict prompt contract enforcing citation & bans)     │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Stage 6: Structured Field Output                       │
│ ├─ **Direct Answer:** (Bottom-line 1-2 sentences)      │
│ ├─ **Explanation:** (Technical analysis & context)     │
│ └─ [Sources Cited]: (Official standard & clause IDs)   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Stage-by-Stage Deep Dive

### Stage 1: HyDE (Hypothetical Document Embeddings)
- **The Problem**: Semantic search between a short casual question and a dense technical clause often scores poorly because their syntax and lexical distributions do not match.
- **The Solution**: Before searching the database, Inspecta asks a high-speed LLM (`llama3-8b` via Groq) to write a *hypothetical standard clause* that would answer the user's question:
  ```
  "You are an expert oil and gas engineer. Write a formal, hypothetical standard clause
   that perfectly answers this question: '[User Question]'. State only formal technical text."
  ```
- **Caching Mechanism**: The generated HyDE text is hashed and saved in a SQLite `hyde_cache` table. When any user asks the same or semantically identical question in the future, the HyDE clause is retrieved from D1 in < 5 milliseconds, avoiding extra API overhead.
- **Result**: Embedding the *hypothetical clause* instead of the *raw question* brings the search vector directly into the technical space of the actual standard.

### Stage 2: Hybrid Search (Dense Vectors + Sparse BM25)
No single search algorithm is sufficient for engineering:
1. **Dense Vector Search (Semantic Understanding)**:
   - Uses **768-dimensional embeddings** (`@cf/baai/bge-base-en-v1.5` on Cloudflare; `all-MiniLM-L6-v2` in LocaSpec).
   - Captures synonyms, concepts, and intentions (e.g. understanding that "MPI", "MT", and "Magnetic Particle Inspection" refer to the same method).
2. **Sparse BM25 Search (Exact Keyword & Code Matching)**:
   - Powered by an SQLite **FTS5 (Full-Text Search)** virtual table.
   - Accurately captures exact alphanumeric identifiers that dense embeddings frequently blur (such as `T-221`, `B31.3 Table 341.3.2`, `Grade L-80`, `1/8 inch`, or `23 HRC`).

### Stage 3: Reciprocal Rank Fusion (RRF)
To fairly merge dense vector similarities (cosine scores between `0.0` and `1.0`) with BM25 rankings (which use negative logarithms), Inspecta uses **Reciprocal Rank Fusion**:

$$\text{RRF Score} = \frac{1}{k + \text{Rank}_{\text{vector}} + 1} + \frac{1}{k + \text{Rank}_{\text{BM25}} + 1}$$

Where $k = 60$. If a clause is ranked in the top 3 by BM25 because of an exact clause number match, and also scored highly by the vector model, its fused score surges to the top. The top 5 non-redundant clauses are passed forward as verified context.

### Stage 4: Dynamic NDT Rules & Filter Injection
The system scans the user query for critical keywords (e.g., `sour service`, `radiography`, `hydrotest`, `casing running`) and checks the `ndt_rules` table. Any active administrative rule is automatically prepended to the system prompt. For instance:
> *Rule*: If the query mentions sour service or wet $H_2S$, explicitly mandate compliance with NACE MR0175 / ISO 15156 hardness and material selection criteria.

### Stage 5: Zero-Contradiction & Anti-Hallucination Framework
Inspecta binds the LLM using a strict prompt contract:
1. **The Citation Mandate**: The model is forbidden from stating any rule or acceptance number without citing the exact clause code (e.g. `[ASME B31.3 Table 341.3.2]`).
2. **The Zero-Contradiction Rule**: If two standards in the retrieved context provide differing acceptance thresholds (e.g. ASME B31.3 vs API 1104 undercut tolerances), the AI is explicitly banned from picking one arbitrarily. Instead, it must highlight the discrepancy and specify the jurisdiction of each code.
3. **Bound to Retrieved Context**: If the retrieved corpus does not contain the answer, the model is strictly programmed to say:
   > *"The loaded standards do not contain explicit criteria for this condition. Please consult your Project Quality Plan or client specification."*

### Stage 6: The "Field-Ready" Output Architecture
Field inspectors reading on mobile screens or inspection tablets cannot parse long, rambling paragraphs. Inspecta enforces a standardized response structure:
- **`**Direct Answer:**`**: Exactly 1 to 2 concise sentences with the bottom line (pass/fail criterion, dimension, or temperature).
- **`**Explanation:**`**: Detailed breakdown containing metallurgical reasoning, inspection technique prerequisites, and notes on practical field execution.
- **`Sources Cited`**: Interactive pills linking to the exact standard and clause.

---

## 4. Multi-Provider AI Inference

Inspecta decouples reasoning from any single vendor by supporting a hot-swappable, multi-provider backend:

| Provider | Supported Models | Primary Advantage | Typical Latency |
| :--- | :--- | :--- | :--- |
| **Groq** | `llama-3.1-70b-versatile`<br>`llama3-8b-8192`<br>`mixtral-8x7b-32768` | Ultra-low latency LPUs; near-instant token streaming | **200ms - 800ms** |
| **OpenRouter** | `nvidia/llama-3.1-nemotron-70b:free`<br>`nvidia/nemotron-4-340b:free`<br>`qwen/qwen-2.5-72b:free`<br>`google/gemma-2-27b:free` | Massive parameter scale (>13B up to 340B); superior technical reasoning | **1.5s - 3.5s** |

If an upstream provider hits a rate limit (HTTP 429), Inspecta's failover harness automatically and silently cascades down fallback models without interrupting the user's workflow.

---

## 5. Bilingual English / Arabic Semantic Bridge

In Middle Eastern energy sectors (e.g., Aramco, ADNOC, KOC, EGPC), inspection teams routinely switch between English engineering terms and Arabic field terminology.

Inspecta maintains cross-lingual equivalence inside its standards knowledge base:
- `مادة الاقتران` $\leftrightarrow$ *Couplant (Ultrasonic)*
- `حفرة التآكل` $\leftrightarrow$ *Corrosion Pit*
- `عدم النفاذ` $\leftrightarrow$ *Lack of Penetration (LOP)*
- `الخبث` $\leftrightarrow$ *Slag Inclusion*
- `اختبار الضغط الهيدروستاتيكي` $\leftrightarrow$ *Hydrostatic Pressure Test*

Inspecta recognizes questions asked in either English or Arabic, retrieves the relevant English clauses, and generates the response in the language preferred by the user, preserving exact standard numbers and formulas in standard Western notation.
