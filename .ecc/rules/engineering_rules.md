# Inspecta Engineering Rules (Always-Loaded Operational Directives)
ECC Compliance Framework

## Rule 1: Git Branch & Version Integrity
- Working branch is strictly `final`.
- Never create unmanaged scratch branches without explicit consent.
- All commits must be descriptive, referencing specific phase changes and verified benchmark scores.

## Rule 2: Design System & Visual Standards
- **Color Palette:** Strictly SAP Horizon Blue (`#0070F2` / `--gemini-blue`), Dark Charcoal (`#131314` / `#1E1F20`), and Subtle Slate Borders (`#303134`).
- **Icons:** Use only clean, monochrome geometric SVG vector paths (Gemini UI standard).
- **Prohibited:** No emojis in technical verdicts, code cards, or chat outputs. Emojis must be stripped using regex filter `stripDistractingEmojis`.

## Rule 3: The Three-Sentence Engineering Mandate
- Sentence 1: Explicit citation of governing standard and clause (e.g. `ASME Section VIII Div 1 UG-27(d)`).
- Sentence 2: Precise numerical acceptance threshold with dual units (e.g. `1.534 in (38.96 mm)`).
- Sentence 3: Explicit rejection / condemnation criterion (e.g. `Values under 1.534 in must be condemned`).
- No conversational filler ("Sure!", "Here is the information", "I'd be happy to help") allowed before Sentence 1.

## Rule 4: Edge Worker Performance & Scalability (Cloudflare 50ms Limit)
- Vector Cosine Similarity in Worker JavaScript memory must be pre-filtered using candidate scoring (`candidates.slice(0, 60)`). Never iterate over unbounded arrays of chunks.
- When queries contain explicit alphanumeric clause markers (`UG-27`, `341.3.2`, `8.1`, `T-260`), bypass HyDE LLM expansion to eliminate 800-1200ms latency tax.
- Ingestion must always prefer batch mode (`/api/admin/ingest-batch`) and transactional database execution (`env.DB.batch(...)`).

## Rule 5: Windows PowerShell Shell Protocol
- Windows execution policy prohibits running unsigned `.ps1` scripts. Always execute `npx.cmd` or direct binary commands.
- Do not use Bash `&&` chains in PowerShell commands; use `;` as the statement separator.
