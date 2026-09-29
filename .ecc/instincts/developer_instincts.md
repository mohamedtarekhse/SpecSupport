# Developer Instincts (Learned Patterns & Anti-Regression Memory)
ECC Compliance Framework

These instincts represent hard-won operational patterns discovered and codified to ensure mistakes are never repeated.

### Instinct 1: Decimal and Abbreviation Protection in Tokenization
- **Context:** Oilfield engineering text is saturated with abbreviations and decimals (`3.2 mm`, `1.534 in`, `UG-27(d)`, `Fig. 4.1`, `API 5CT Clause 8.1.1`).
- **Instinct:** Never split sentences with naive `. ` splits. Always employ the decimal-protected boundary tokenizer:
  `/(?<!\b(?:e\.g|i\.e|Table|Fig|Sec|Para|UG|UW|API|ASME|AWS|ISO|No|Rev|\d))\.\s+(?=[A-Z0-9\(\[])/g`
- **Overlap:** Always retain 120-150 characters of sliding context into the next chunk so multi-sentence clauses and exceptions are never severed.

### Instinct 2: Streaming Number Token Coercion
- **Context:** In Server-Sent Events (SSE) streaming, JSON parsers may yield numeric tokens as primitives (e.g. `{"token": 1}` or `{"token": 8}`) instead of strings.
- **Instinct:** Always coerce token payloads using `(parsed.token !== undefined ? String(parsed.token) : '')`. Never rely on truthy checks like `if (parsed.token)` which drop `0` and falsy numerical digits!

### Instinct 3: Standard-Scoped Table Matching
- **Context:** Queries with generic keywords (`minimum`, `wall`, `thickness`) can match unrelated tables across different standards if unconstrained.
- **Instinct:** Always extract the governing standard (`detectedStd`) first and constrain SQL queries with `AND standard_code LIKE ?`. Strip generic stopwords (`minimum`, `maximum`, `allowable`, `requirement`) before table keyword matching.

### Instinct 4: Lazy Loading Heavy Client Assets
- **Context:** Bundling multi-megabyte WASM models (like `tesseract.js`) in HTML heads destroys mobile FCP/TTI over satellite or field rig cellular networks.
- **Instinct:** Load OCR engines dynamically on demand via `ensureTesseractLoaded()` only when scanned image pages (<25 characters of layout text) are encountered.

### Instinct 5: Verification Gate Before Task Sign-Off
- **Context:** Declaring a task complete without empirical verification risks regression.
- **Instinct:** Always execute `test_accuracy_suite.js` (or relevant test suite) and verify that 100% of assertions pass before completing the turn.

### Instinct 6: Client-Side Batch Ingestion Buffering
- **Context:** Ingesting large PDFs (300+ pages) requires chunk batching to prevent saturating D1 roundtrips.
- **Instinct:** Ensure the batch buffer (`let pendingChunks = []`) and its transactional flush function (`flushChunkBatch`) are properly declared in the upload scope before the page loop, with an explicit post-loop tail flush to guarantee zero orphaned chunks.

### Instinct 7: Universal RAG Execution & Standard-Scoped Source Citation Guard
- **Context:** Bypassing chunk retrieval in non-standards modes or performing blind single-keyword table searches causes accidental cross-standard contamination (e.g. `API RP 8B Table 1` being attached to questions about welding, masts, or casing).
- **Instinct:** Always run the vector/clause RAG pipeline across all modes, infer `detectedStd` early from equipment keywords, give matching standard chunks a strong candidate ranking boost (`-2000`), and strictly prohibit unconstrained table queries across `standards_tables` when `detectedStd` is missing.
