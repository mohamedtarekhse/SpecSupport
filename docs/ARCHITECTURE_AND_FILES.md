# Inspecta - System Architecture & File-by-File Documentation

This document provides a comprehensive technical overview of each core file, directory, and system component within the **Inspecta** codebase (both Cloudflare Serverless and the LocaSpec Local Python distribution).

---

## 1. System High-Level Architecture

Inspecta is an AI-powered QA/QC and Non-Destructive Testing (NDT) engineering assistant designed for the Oil & Gas industry. It delivers real-time, deterministic, citation-backed answers strictly derived from official codes (API, ASME, AWS, ISO, NACE, ASNT).

```
                            ┌──────────────────────────────────────────────┐
                            │             User Browser / Device            │
                            │   (index.html: Vanilla JS + CSS3 + marked)   │
                            └──────────────────────┬───────────────────────┘
                                                   │
                        ┌──────────────────────────┴──────────────────────────┐
                        │                                                     │
                        ▼                                                     ▼
    ┌───────────────────────────────────────┐             ┌───────────────────────────────────────┐
    │    Online Mode (Cloudflare Edge)      │             │    Offline / Local Mode (LocaSpec)    │
    │  worker/src/index.js (Hono Framework) │             │    LocaSpec/app.py (Python Flask)     │
    ├───────────────────────────────────────┤             ├───────────────────────────────────────┤
    │ • Cloudflare Workers AI (Embeddings)  │             │ • Sentence-Transformers (Local CPU)   │
    │ • Cloudflare D1 (SQLite + FTS5)       │             │ • Local SQLite (database.db)          │
    │ • HyDE Cache in D1                    │             │ • Local HyDE Cache                    │
    │ • Multi-Provider (Groq / OpenRouter)  │             │ • Groq API Client                     │
    └───────────────────────────────────────┘             └───────────────────────────────────────┘
```

---

## 2. Directory Structure

```
inspect support/
├── docs/                                # Technical & audience documentation
│   ├── ARCHITECTURE_AND_FILES.md        # This document
│   ├── HOW_AI_COMPREHENDS_STANDARDS.md  # Deep-dive into RAG, HyDE & Hybrid Search
│   └── AUDIENCE_PRESENTATION.md         # Pitch, demo walkthrough & stakeholder brief
├── index.html                           # Production UI (single-page responsive app)
├── schema.sql                           # Cloudflare D1 SQLite database schema
├── migrate.sql                          # Database migration script for new features
├── demo.py                              # Standalone interactive terminal demo script
├── worker/                              # Cloudflare Serverless Edge Worker
│   ├── wrangler.toml                    # Cloudflare Worker configuration & bindings
│   ├── package.json                     # Node.js dependencies for Cloudflare deployment
│   └── src/
│       └── index.js                     # Edge backend API (Hono, RAG, Hybrid Search)
├── LocaSpec/                            # Standalone Local Python Edition
│   ├── app.py                           # Local Flask API server & RAG pipeline
│   ├── requirements.txt                 # Python dependencies (Flask, sentence-transformers)
│   ├── run.bat                          # One-click Windows starter script
│   └── static/
│       └── index.html                   # Pre-routed UI for http://localhost:5000
├── scripts/                             # Utility & data-processing pipelines
│   ├── pdf_processor.py                 # PDF parsing, clause tagging & extraction
│   ├── ingest.js                        # Knowledge base upload pipeline to Cloudflare D1
│   └── ocr_page.ps1                     # PowerShell OCR helper for scanned documents
└── standards/                           # Verified engineering standards corpus (26+ codes)
    ├── API 53.txt                       ├── ASME_B31.4_Liquid_Pipeline.txt
    ├── API_1104_Pipeline_Welding.txt    ├── ASME_B31.8_Gas_Pipeline.txt
    ├── API_510_Vessel_Inspection.txt    ├── ASME_V_Article2_RT.txt
    ├── API_570_Piping_Inspection.txt    ├── ASME_V_Article4_UT.txt
    ├── API_5CT_Casing_Tubing.txt        ├── AWS_B1.11_Visual_Examination.txt
    ├── API_RP_2X_Offshore_UT.txt        ├── AWS_D1.1_Visual_Acceptance.txt
    ├── API_RP_4G_Generated.txt          ├── ISO_3834-2_Welding_Quality.txt
    └── ...                              └── NACE_MR0175_Sour_Service.txt
```

---

## 3. Core File Documentation

### `index.html` (Main Frontend Application)
- **Role**: Single-file, zero-dependency client interface that serves the web application.
- **Key Capabilities**:
  - **Dynamic Theme Engine**: Automatic light/dark mode with CSS custom variables, custom scrollbars, and high-contrast typography designed for field tablet usage.
  - **Markdown & Math Rendering**: Integrates `marked.js` with sanitization to display tables, bullet points, and equations.
  - **Zero-Touch PDF Ingestion**: Uses `pdf.js` in-browser to extract text from user-uploaded PDFs, chunk them into standard clauses, and upload them directly to `/api/admin/ingest`.
  - **Admin Control Center**: Built-in sliding sidebar gated by Admin Token. Allows administrators to configure API keys (Groq & OpenRouter), switch active providers, select free models (>13B, including NVIDIA Nemotron), manage NDT rules, and benchmark model outputs.
  - **Crowdsourced Validation ("Earn" Mode)**: Interface allowing certified inspectors to review peer answers, solve validation questions, and raise daily usage quotas.
  - **Cache Buster Utility**: Header-mounted `♻️` button that invalidates service worker caches, clears local session artifacts, and forces latest production bundle fetches.
  - **Bilingual Interface**: Full bi-directional Arabic/English support (`dir="rtl"` / `dir="ltr"`), oilfield jargon translations, and responsive mobile-first drawer navigation.

### `worker/src/index.js` (Cloudflare Serverless Edge Backend)
- **Role**: High-performance REST & Streaming API built on the **Hono** framework running across 300+ Cloudflare edge nodes worldwide.
- **Core Endpoints**:
  - `POST /api/ask`: Core question-answering pipeline. Runs HyDE, executes Hybrid Search, compiles system context, invokes selected LLM, and logs analytics.
  - `POST /api/ask/stream`: Server-Sent Events (SSE) streaming endpoint for live real-time token rendering.
  - `POST /api/admin/ingest`: Receives clause chunks, calls Cloudflare Workers AI (`@cf/baai/bge-base-en-v1.5`) for 768-dimensional dense vectors, and stores them in D1.
  - `POST /api/admin/config`: Manages system configurations (API keys, default models, active provider) stored securely in D1 `system_config`.
  - `POST /api/admin/rules`: Injects dynamic prompt guidelines (e.g. "For sour service, always verify NACE MR0175 hardness limits").
  - `POST /api/admin/compare`: Benchmarking harness to execute the same query across multiple models side-by-side.
  - `POST /api/usage/check`: Enforces daily query limits based on session ID and expert status.
  - `GET /api/earn/questions` & `POST /api/earn/submit`: Crowdsourced NDT verification quiz system.
- **AI Engine Implementation**:
  - **HyDE Pipeline**: Synthesizes a hypothetical standard clause using fast LLMs (`llama3-8b-8192`) and caches it in D1 to accelerate identical future queries.
  - **Hybrid Search**: Combines BM25 keyword matching via SQLite FTS5 with dense vector cosine similarity via Cloudflare Workers AI. Merges rankings using Reciprocal Rank Fusion (RRF).
  - **Multi-Provider Failover**: Dynamically routes between **Groq** (`llama-3.1-70b-versatile`, `llama3-8b-8192`, `mixtral-8x7b`) and **OpenRouter** (NVIDIA Nemotron 70B/340B, Llama 3.1 70B, Qwen 2.5 72B), preventing downtime from rate limits.

### `worker/wrangler.toml` (Cloudflare Configuration)
- **Role**: Infrastructure-as-code declaration for the Cloudflare Worker.
- **Declarations**:
  - `main`: Points to entry file `src/index.js`.
  - `compatibility_date`: Locks Cloudflare Runtime features.
  - `d1_databases`: Binds Cloudflare D1 database `inspection-db`.
  - `ai`: Binds Cloudflare Workers AI for serverless vector embeddings.
  - `vars`: Environment defaults (`OPENROUTER_MODEL`, `ALLOWED_ORIGIN`).

### `schema.sql` & `migrate.sql` (Database Definitions)
- **Role**: Relational SQL schemas designed for Cloudflare D1 and SQLite.
- **Tables**:
  - `standards_chunks`: Primary knowledge repository (`standard_code`, `standard_name`, `section`, `clause`, `content`, `embedding` vector blob).
  - `standards_fts`: SQLite FTS5 virtual table indexing chunk text for BM25 term frequency search.
  - `usage_log`: Auditing table logging query volume, session IDs, model tags, and timestamps.
  - `user_subscriptions`: Session registry controlling daily quotas (default: 10/day; unlimited for verified LinkedIn experts).
  - `crowdsource_questions` & `crowdsource_answers`: Community QA dataset for training and verification.
  - `ndt_rules`: Dynamically injected engineering constraints.
  - `system_config`: Key-value storage for provider keys and active models.
  - `hyde_cache`: Pre-computed hypothetical documents indexed by question hash.

### `LocaSpec/app.py` (Local Python Edition Backend)
- **Role**: Complete, portable, 100% local Python implementation of the Inspecta pipeline.
- **Capabilities**:
  - Runs a local **Flask** server with CORS enabled.
  - Uses a local `database.db` SQLite file with FTS5 virtual tables.
  - Loads Hugging Face's `sentence-transformers` (`all-MiniLM-L6-v2`) on local hardware to compute embeddings without sending text outside the machine.
  - Implements cosine similarity search in **NumPy** for microsecond similarity ranking.
  - Connects to Groq for ultra-fast generation while keeping all document retrieval, chunking, and database storage strictly on-premise.

### `LocaSpec/run.bat` & `LocaSpec/requirements.txt`
- **Role**: Self-bootstrapping launcher for field laptops.
- Automatically creates or updates Python virtual dependencies (`Flask`, `sentence-transformers`, `numpy`, `requests`) and launches `http://localhost:5000`.

### `scripts/pdf_processor.py` (Intelligent Standard Parser)
- **Role**: Automated preprocessing script for raw PDF standards.
- **Features**:
  - Regular-expression matching tailored to engineering clause numbering (e.g. `T-221`, `Section 5.3`, `API 1104 Clause 9.2`).
  - Cleans headers, footers, and page numbers.
  - Formats text into structured blocks with `[STANDARD]`, `[CLAUSE]`, `[ACCEPTANCE]`, and `[REJECTION]` labels for optimal vector embedding.

### `scripts/ingest.js` (Bulk Knowledge Ingestion Pipeline)
- **Role**: Node.js batch-uploader that reads standards from `standards/`, batches them into payloads, calls the embedding API, and writes them into D1 via Wrangler or HTTP.

### `standards/` Directory (Engineering Corpus)
- **Role**: Curated, verified knowledge base spanning 26+ mission-critical industry standards.
- **Format**: Plain text files with standardized header tags and clean separation of clauses.
- **Coverage**:
  - **Non-Destructive Testing (NDT)**: ASME Section V (RT, UT, PT, MT), API RP 2X, ASNT SNT-TC-1A, AWS B1.11.
  - **Piping & Pipelines**: ASME B31.3, ASME B31.4, ASME B31.8, API 1104, API 570.
  - **Pressure Vessels & Welding**: ASME Section VIII Div 1, ASME Section IX, API 510, ISO 3834-2, AWS D1.1.
  - **Drilling, Well Control & Tubulars**: API 53 (BOP), API 16D, API 5CT (Casing/Tubing), API RP 5C1, API RP 7G-2 (Drill Stem), API RP 4G, API RP 7K, API RP 8B.
  - **Metallurgy & Corrosion**: NACE MR0175 / ISO 15156 (Sour Service).
