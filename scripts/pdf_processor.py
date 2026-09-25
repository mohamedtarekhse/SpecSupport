import os
import sys
import json
import time
import tempfile
import subprocess
import requests
import pymupdf  # PyMuPDF

# ==========================================
# CONFIGURATION
# ==========================================
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()
if not OPENROUTER_API_KEY:
    raise SystemExit("OPENROUTER_API_KEY is not set. Export it first, e.g.:\n"
                     "  $env:OPENROUTER_API_KEY = \"sk-or-...\" ; python scripts/pdf_processor.py <pdf> <name>")
# Ordered fallback chain: first model that responds wins (free models rate-limit unpredictably).
MODELS = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nex-agi/nex-n2.5-pro:free",
    "qwen/qwen3.8-27b:free",
]
MAX_TRIES_PER_MODEL = 2
RETRY_SLEEP = 20

OCR_MIN_CHARS = 100   # pages with less text than this are treated as image-only and OCR'd
OCR_DPI = 250

SYSTEM_PROMPT = """You are a senior oil and gas inspection engineer. 
Your task is to convert raw PDF text extracted from a technical standard into structured inspection knowledge chunks.

=== OUTPUT FORMAT — FOLLOW EXACTLY ===
For each technical clause, rule, or table found in the text, extract it and output:

---
CLAUSE: {NUMBER} — {TITLE}
{EXPLANATION in plain technical English - what is the requirement, why it exists, how it is verified}
ACCEPTANCE: {exact numeric pass criteria, or N/A}
REJECTION: {exact fail criteria, or N/A}

CRITICAL RULES:
1. Ignore page numbers, headers, footers, and the table of contents.
2. Group related sub-clauses (e.g., 5.1.1 and 5.1.2) into a single logical chunk if they belong to the same topic.
3. TABLES ARE CRITICAL: convert EVERY table row of acceptance/rejection/deviation criteria into a CLAUSE block that preserves the EXACT numeric values (dimensions, tolerances, percentages, temperatures, wire counts). Never round, generalize, or drop a tabled value.
4. If a section of the text is marked as OCR or comes from an image, faithfully reconstruct the intended content using the OCR as the source of truth. Preserve numeric values exactly; do NOT invent values that do not appear in the source.
5. Separate EVERY clause block with exactly `---` on its own line.
6. ONLY output the formatted clauses. Do not add conversational filler like "Here is the output".
"""

class Log:
    def __init__(self, pdf_path):
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        base = os.path.splitext(os.path.basename(pdf_path))[0]
        self.path = os.path.join(log_dir, f"{base}_run.log")
        open(self.path, 'w', encoding='utf-8').close()

    def write(self, msg):
        print(msg)
        with open(self.path, 'a', encoding='utf-8') as f:
            f.write(msg + "\n")


def chunk_text(text, max_chars=12000):
    """Splits text into chunks of roughly max_chars to avoid overflowing the AI context window."""
    chunks = []
    while len(text) > max_chars:
        split_index = text.rfind('\n\n', 0, max_chars)
        if split_index == -1:
            split_index = max_chars
        chunks.append(text[:split_index])
        text = text[split_index:].strip()
    if text:
        chunks.append(text)
    return chunks


def render_page(page, path, dpi=OCR_DPI):
    pix = page.get_pixmap(dpi=dpi)
    pix.save(path)


def ocr_with_pytesseract(img_path):
    import pytesseract
    from PIL import Image
    return pytesseract.image_to_string(Image.open(img_path))


def ocr_with_windows(img_path):
    helper = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ocr_page.ps1')
    if not os.path.exists(helper):
        return None
    cp = subprocess.run(
        ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', helper, img_path],
        capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=180
    )
    if cp.returncode == 0 and cp.stdout and cp.stdout.strip():
        return cp.stdout
    if cp.stderr and cp.stderr.strip():
        print(f"    windows OCR stderr: {cp.stderr.strip()[:200]}")
    return None


def ocr_page(page, tmp_dir):
    tmp = os.path.join(tmp_dir, '_ocr_page.png')
    render_page(page, tmp)
    for name, fn in [("pytesseract", ocr_with_pytesseract), ("windows", ocr_with_windows)]:
        try:
            out = fn(tmp)
            if out and len(out.strip()) > 20:
                return name, out.strip()
        except Exception as e:
            print(f"    OCR [{name}] unavailable: {e}")
    return None, ""


def extract_pages(pdf_path, log):
    """Returns (pages:list[str], pages_ocr:list[int]) with OCR fallback for image-only pages."""
    log.write(f"Reading PDF: {pdf_path}")
    doc = pymupdf.open(pdf_path)
    pages = []
    pages_ocr = []
    with tempfile.TemporaryDirectory() as tmp:
        for pno in range(len(doc)):
            page = doc[pno]
            t = page.get_text('text').strip()
            if len(t) < OCR_MIN_CHARS:
                log.write(f"  page {pno+1}: low text ({len(t)} chars) -> OCR")
                engine, ocr = ocr_page(page, tmp)
                if ocr:
                    pages_ocr.append(pno + 1)
                    t = (t + "\n\n[OCR PAGE %d — EXTRACTED FROM AN EMBEDDED IMAGE/TABLE PAGE USING %s OCR]\n" % (pno + 1, engine)) + ocr
                    log.write(f"    OCR'd with {engine}: {len(ocr)} chars")
                else:
                    log.write("    OCR failed, page skipped")
            pages.append(t)
    return pages, pages_ocr


def call_openrouter(model, messages, temperature=0.1):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": messages,
        "temperature": temperature
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data, timeout=300)
    body = response.json()
    if response.status_code == 200 and isinstance(body, dict):
        try:
            content = body['choices'][0]['message']['content']
            if content:
                return content
            raise ValueError("empty completion content")
        except (KeyError, IndexError, ValueError) as e:
            return None, response.status_code, f"malformed 200 response: {e}"
    error = response.text
    try:
        error = body.get("error", {}).get("message", response.text)
    except Exception:
        pass
    return None, response.status_code, error


def process_chunk(chunk, standard_name):
    prompt = f"Extract and format the technical clauses from the following section of {standard_name}:\n\nRAW TEXT:\n{chunk}"
    for model in MODELS:
        for attempt in range(1, MAX_TRIES_PER_MODEL + 1):
            try:
                print(f"  -> trying {model} (attempt {attempt})...")
                result = call_openrouter(model, [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ])
                if isinstance(result, str):
                    return result, model
                content, status, err = result
                print(f"     {model} failed (HTTP {status}): {err}")
            except Exception as e:
                print(f"     {model} threw exception: {e}")
            if attempt < MAX_TRIES_PER_MODEL:
                print(f"     retrying in {RETRY_SLEEP}s...")
                time.sleep(RETRY_SLEEP)
        time.sleep(RETRY_SLEEP)
    return None, None


def main():
    if len(sys.argv) < 3:
        print("Usage: python pdf_processor.py <path_to_pdf> <Standard_Name>")
        print('Example: python pdf_processor.py "API_5C1.pdf" "API RP 5C1"')
        sys.exit(1)

    pdf_path = sys.argv[1]
    standard_name = sys.argv[2]

    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        sys.exit(1)

    log = Log(pdf_path)
    out_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'standards', f"{standard_name.replace(' ', '_')}_Generated.txt")

    pages, pages_ocr = extract_pages(pdf_path, log)
    total_chars = sum(len(p) for p in pages)
    log.write(f"Total characters extracted: {total_chars} (pages OCR'd: {pages_ocr or 'none'})")

    raw_text = "\n\n".join(pages)
    chunks = chunk_text(raw_text, max_chars=12000)
    log.write(f"Split into {len(chunks)} chunks for AI processing.")

    saved = 0
    failed = []
    used_models = set()
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write(f"[STANDARD: {standard_name}]\n")
        f.write(f"[TITLE: {standard_name} Extracted Data]\n\n")

        for i, chunk in enumerate(chunks):
            log.write(f"\n--- Processing Chunk {i+1}/{len(chunks)} ---")
            formatted_text, used_model = process_chunk(chunk, standard_name)

            if formatted_text:
                f.write(formatted_text.strip() + "\n\n")
                saved += 1
                if used_model:
                    used_models.add(used_model)
                log.write(f"Chunk {i+1} saved successfully (model: {used_model}).")
            else:
                failed.append(i + 1)
                log.write(f"Chunk {i+1} FAILED after all models. Skipping.")

            time.sleep(3)

    log.write(f"\nDone! Saved structured text to {out_file}")
    log.write(f"Chunks saved: {saved}/{len(chunks)} (models used: {', '.join(sorted(used_models)) or 'none'})")
    if failed:
        log.write(f"Failed chunks (skipped): {failed}")
    else:
        log.write("All chunks processed successfully!")
    log.write("Full run log: " + log.path)
    print("You can now run 'node scripts/ingest.js' to add it to your D1 database.")


if __name__ == "__main__":
    main()