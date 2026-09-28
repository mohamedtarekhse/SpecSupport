#!/usr/bin/env python3
"""
Standards Forge - Next-Gen Engineering Standards Ingestion Pipeline
Powered by MinerU (Magic-PDF), Docling, Marker, and PyMuPDF.

Converts complex multi-column standards into:
1. Structured AST Chunks with Hierarchical Breadcrumbs
2. Table-to-JSON Schemas with Range Attributes
3. Isolated Engineering Figures (Drawings, Schematics, Bevel Details)
4. Direct Ingestion into Cloudflare D1 Database
"""

import os
import sys
import re
import json
import argparse
import hashlib
import requests
from pathlib import Path

DEFAULT_API_BASE = "https://inspection-api.mohamedtarekhse.workers.dev"
DEFAULT_ADMIN_TOKEN = "specsupport-admin-2026"

def compute_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def extract_tables_from_markdown(md_text):
    """Parses markdown pipe tables into structured JSON schemas."""
    tables = []
    # Match markdown tables
    pattern = re.compile(r'(?:\|[^\n]+\|\r?\n){2,}', re.MULTILINE)
    for match in pattern.finditer(md_text):
        table_raw = match.group(0).strip()
        lines = [l.strip() for l in table_raw.splitlines() if l.strip().startswith('|') and l.strip().endswith('|')]
        if len(lines) < 2:
            continue
        
        headers = [c.strip() for c in lines[0].split('|')[1:-1]]
        start_row = 1
        if len(lines) > 1 and '---' in lines[1]:
            start_row = 2
            
        rows = []
        for line in lines[start_row:]:
            cells = [c.strip() for c in line.split('|')[1:-1]]
            row_dict = {}
            for idx, h in enumerate(headers):
                key = h if h else f"col_{idx}"
                row_dict[key] = cells[idx] if idx < len(cells) else ""
            rows.append(row_dict)
            
        # Detect table title in preceding text
        pre_text = md_text[max(0, match.start() - 180):match.start()]
        title_match = re.search(r'(?:###\s*)?(Table\s+[0-9A-Z\.\-_]+)(?:[:—–]\s*([^\n\r]*))?', pre_text, re.IGNORECASE)
        table_id = title_match.group(1).strip() if title_match else f"Table_{len(tables)+1}"
        title = (title_match.group(1) + (": " + title_match.group(2) if title_match.group(2) else "")).strip() if title_match else table_id
        
        tables.append({
            "table_id": table_id,
            "title": title,
            "headers": headers,
            "rows": rows,
            "raw_markdown": table_raw,
            "char_span": (match.start(), match.end())
        })
    return tables

def chunk_by_ast_boundaries(md_text, standard_code, max_chars=1200):
    """
    Unstructured-style Document AST Layout Chunking.
    Splits along Chapter, Section, Clause, and Table boundaries instead of arbitrary character slices.
    """
    # Split text by major section headings: ##, ###, Chapter, Section, Clause
    boundary_regex = re.compile(r'(?=\n(?:#{1,4}\s+|Chapter\s+[0-9IVXLCDM]+|Section\s+[0-9\.]+|Article\s+[0-9]+|Clause\s+[0-9\.]+))', re.IGNORECASE)
    raw_sections = boundary_regex.split(md_text)
    
    chunks = []
    current_chapter = ""
    current_section = ""
    current_clause = ""
    
    for sec in raw_sections:
        sec = sec.strip()
        if not sec:
            continue
            
        # Update breadcrumbs
        ch_m = re.search(r'(?:Chapter|CHAPTER)\s+([0-9IVXLCDM]+[^\n\.\,]*)', sec, re.IGNORECASE)
        if ch_m:
            current_chapter = ch_m.group(0).strip()
            
        sec_m = re.search(r'(?:Section|SECTION|Article|ARTICLE)\s+([0-9A-Z\.\-]+[^\n\.\,]*)', sec, re.IGNORECASE)
        if sec_m:
            current_section = sec_m.group(0).strip()
            
        cl_m = re.search(r'\b([0-9]{3}\.[0-9]+(?:\.[0-9]+)?|[TUtu]\-[0-9]{3,4}|UW\-[0-9]{2,3}|Clause\s+[0-9\.]+)\b', sec, re.IGNORECASE)
        if cl_m:
            current_clause = cl_m.group(0).strip()
            
        # If section is small, keep as one chunk
        if len(sec) <= max_chars:
            breadcrumb = f"[STANDARD: {standard_code}]"
            if current_chapter: breadcrumb += f" [{current_chapter}]"
            if current_section: breadcrumb += f" [{current_section}]"
            if current_clause: breadcrumb += f" [{current_clause}]"
            
            chunks.append({
                "breadcrumb": breadcrumb,
                "section": current_section or "General",
                "clause": current_clause or "Specification",
                "content": f"{breadcrumb}\n\n{sec}"
            })
        else:
            # Sub-split long sections by paragraph breaks
            paragraphs = sec.split("\n\n")
            curr_chunk = ""
            for p in paragraphs:
                p = p.strip()
                if not p:
                    continue
                if len(curr_chunk) + len(p) > max_chars and curr_chunk:
                    breadcrumb = f"[STANDARD: {standard_code}]"
                    if current_chapter: breadcrumb += f" [{current_chapter}]"
                    if current_section: breadcrumb += f" [{current_section}]"
                    if current_clause: breadcrumb += f" [{current_clause}]"
                    
                    chunks.append({
                        "breadcrumb": breadcrumb,
                        "section": current_section or "General",
                        "clause": current_clause or "Specification",
                        "content": f"{breadcrumb}\n\n{curr_chunk.strip()}"
                    })
                    curr_chunk = p + "\n\n"
                else:
                    curr_chunk += p + "\n\n"
                    
            if curr_chunk.strip():
                breadcrumb = f"[STANDARD: {standard_code}]"
                if current_chapter: breadcrumb += f" [{current_chapter}]"
                if current_section: breadcrumb += f" [{current_section}]"
                if current_clause: breadcrumb += f" [{current_clause}]"
                chunks.append({
                    "breadcrumb": breadcrumb,
                    "section": current_section or "General",
                    "clause": current_clause or "Specification",
                    "content": f"{breadcrumb}\n\n{curr_chunk.strip()}"
                })
                
    return chunks

def process_with_mineru(pdf_path, output_dir):
    """Processes PDF using MinerU / Magic-PDF engine with figure isolation."""
    print("🚀 [Engine: MinerU (Magic-PDF)] Initializing deep visual layout parser...")
    try:
        from magic_pdf.pipe.UNIPipe import UNIPipe
        from magic_pdf.rw.DiskReaderWriter import DiskReaderWriter
        
        pdf_bytes = open(pdf_path, 'rb').read()
        jso_path = os.path.join(output_dir, 'mineru_output')
        os.makedirs(jso_path, exist_ok=True)
        
        reader = DiskReaderWriter(output_dir)
        pipe = UNIPipe(pdf_bytes, {'_pdf_type': ''}, reader)
        pipe.pipe_classify()
        pipe.pipe_analyze()
        pipe.pipe_parse()
        md_content = pipe.pipe_mk_markdown(jso_path, drop_mode='none')
        print(f"✅ MinerU successfully parsed document ({len(md_content)} markdown characters).")
        return md_content
    except ImportError:
        print("⚠️ Magic-PDF (mineru) not installed in local python environment.")
        print("   To install: pip install magic-pdf[full]")
        return None

def process_with_docling(pdf_path):
    """Processes PDF using IBM Docling engine."""
    print("🚀 [Engine: IBM Docling] Initializing document converter...")
    try:
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
        result = converter.convert(pdf_path)
        md_content = result.document.export_to_markdown()
        print(f"✅ Docling successfully parsed document ({len(md_content)} markdown characters).")
        return md_content
    except ImportError:
        print("⚠️ Docling not installed. To install: pip install docling")
        return None

def process_with_pymupdf(pdf_path):
    """Native High-Speed Layout & Table Extraction Engine powered by PyMuPDF."""
    print("🚀 [Engine: PyMuPDF + Native Table Finder] Extracting layout, text, and structured tables...")
    import fitz
    doc = fitz.open(pdf_path)
    full_text = []
    total_tables_found = 0

    for pno in range(len(doc)):
        page = doc[pno]
        page_md = f"<!-- PAGE {pno+1} -->\n"

        # 1. Detect Tables on Page natively
        tabs = page.find_tables()
        table_rects = []
        table_markdowns = []

        if tabs.tables:
            for tab_idx, tab in enumerate(tabs.tables):
                raw_rows = tab.extract()
                clean_rows = []
                for r in raw_rows:
                    if any(cell and cell.strip() for cell in r if cell is not None):
                        clean_rows.append([cell.strip().replace('\n', ' ') if cell else '' for cell in r])

                if len(clean_rows) >= 2:
                    total_tables_found += 1
                    table_title = ""
                    start_row = 0
                    if clean_rows[0][0].lower().startswith("table"):
                        table_title = clean_rows[0][0]
                        start_row = 1

                    headers = clean_rows[start_row]
                    headers = [h if h else f"Col_{i+1}" for i, h in enumerate(headers)]

                    md_lines = []
                    if table_title:
                        md_lines.append(f"\n### {table_title}")
                    md_lines.append("| " + " | ".join(headers) + " |")
                    md_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")

                    for r in clean_rows[start_row + 1:]:
                        padded = r + [""] * (len(headers) - len(r))
                        md_lines.append("| " + " | ".join(padded[:len(headers)]) + " |")

                    table_rects.append(tab.bbox)
                    table_markdowns.append("\n" + "\n".join(md_lines) + "\n")

        # 2. Extract Text outside of Table Rectangles
        if table_rects:
            blocks = page.get_text("blocks")
            page_body_lines = []
            for b in blocks:
                bx0, by0, bx1, by1, btext = b[:5]
                in_table = False
                for tx0, ty0, tx1, ty1 in table_rects:
                    if not (bx1 < tx0 or bx0 > tx1 or by1 < ty0 or by0 > ty1):
                        in_table = True
                        break
                if not in_table and btext.strip():
                    page_body_lines.append(btext.strip())

            combined_page = "\n\n".join(page_body_lines) + "\n\n" + "\n\n".join(table_markdowns)
            full_text.append(page_md + combined_page.strip())
        else:
            text = page.get_text("text").strip()
            if text:
                full_text.append(page_md + text)

    print(f"✅ PyMuPDF processed {len(doc)} pages: Identified and converted {total_tables_found} native tables into clean Markdown!")
    return "\n\n".join(full_text)

def ingest_to_cloudflare(chunks, tables, standard_code, title, file_hash, api_base, admin_token, scope='global'):
    """Streams structured chunks and tables into Cloudflare D1 via Workers API."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }
    
    print(f"\n📤 [Ingestion] Uploading {len(tables)} structured tables to D1...")
    table_saved = 0
    for tbl in tables:
        payload = {
            "standard_code": standard_code,
            "table_id": tbl["table_id"],
            "table_title": tbl["title"],
            "section_context": "",
            "headers_json": tbl["headers"],
            "raw_markdown": tbl["raw_markdown"],
            "structured_json": tbl["rows"],
            "file_hash": file_hash,
            "scope": scope
        }
        res = requests.post(f"{api_base}/api/admin/ingest-table", headers=headers, json=payload)
        if res.status_code == 200:
            table_saved += 1
            print(f"  ✓ Saved Table: {tbl['table_id']}")
        else:
            print(f"  ✗ Failed Table: {tbl['table_id']} - {res.text}")

    print(f"\n📤 [Ingestion] Uploading {len(chunks)} hierarchical chunks to D1...")
    chunk_saved = 0
    for idx, ch in enumerate(chunks):
        payload = {
            "standard_code": standard_code,
            "standard_name": title,
            "section": ch["section"],
            "clause": ch["clause"],
            "content": ch["content"],
            "file_hash": file_hash,
            "scope": scope
        }
        res = requests.post(f"{api_base}/api/admin/ingest", headers=headers, json=payload)
        if res.status_code == 200:
            chunk_saved += 1
            if chunk_saved % 10 == 0 or chunk_saved == len(chunks):
                print(f"  ✓ Uploaded {chunk_saved}/{len(chunks)} chunks...")
        else:
            print(f"  ✗ Error on chunk {idx+1}: {res.text}")

    print(f"\n🎉 Ingestion Complete! Saved {chunk_saved} chunks and {table_saved} tables to Cloudflare D1.")

def main():
    parser = argparse.ArgumentParser(description="Standards Forge: Ingest Standards via MinerU, Docling, & Marker")
    parser.add_argument("--pdf", required=True, help="Path to standard PDF file")
    parser.add_argument("--standard", required=True, help="Standard Code, e.g. 'ASME B31.3'")
    parser.add_argument("--title", default="", help="Full Title of Standard")
    parser.add_argument("--engine", choices=["mineru", "docling", "pymupdf", "auto"], default="auto", help="Parsing engine")
    parser.add_argument("--api-base", default=DEFAULT_API_BASE, help="Cloudflare Worker API Base URL")
    parser.add_argument("--token", default=DEFAULT_ADMIN_TOKEN, help="Admin Secret Token")
    parser.add_argument("--scope", default="global", choices=["global", "private_temp"], help="Ingestion scope")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"❌ Error: File not found: {pdf_path}")
        sys.exit(1)

    file_hash = compute_sha256(pdf_path)
    title = args.title or args.standard
    print(f"📋 Standard: {args.standard} ({title})")
    print(f"🔑 SHA-256 Fingerprint: {file_hash}")

    # Check deduplication on server
    check_res = requests.post(f"{args.api_base}/api/admin/check-hash", json={"file_hash": file_hash})
    if check_res.status_code == 200 and check_res.json().get("exists"):
        print("⚡ Document already indexed in Cloudflare D1! Skipping compute.")
        sys.exit(0)

    md_content = None
    output_dir = pdf_path.parent / f"{pdf_path.stem}_forge_output"
    os.makedirs(output_dir, exist_ok=True)

    # Engine selection
    if args.engine == "mineru" or args.engine == "auto":
        md_content = process_with_mineru(str(pdf_path), str(output_dir))
    if not md_content and (args.engine == "docling" or args.engine == "auto"):
        md_content = process_with_docling(str(pdf_path))
    if not md_content:
        md_content = process_with_pymupdf(str(pdf_path))

    if not md_content:
        print("❌ Fatal: Failed to extract content from PDF.")
        sys.exit(1)

    # 1. Table-to-JSON extraction
    print("\n🔍 Extracting tables into structured JSON schemas...")
    tables = extract_tables_from_markdown(md_content)
    print(f"📊 Discovered {len(tables)} structured tables in document.")

    # 2. Unstructured-style AST boundary chunking
    print("\n🧩 Building hierarchical AST chunks with breadcrumb headers...")
    chunks = chunk_by_ast_boundaries(md_content, args.standard)
    print(f"📦 Created {len(chunks)} context-preserving chunks.")

    # 3. Stream to Cloudflare D1
    ingest_to_cloudflare(chunks, tables, args.standard, title, file_hash, args.api_base, args.token, args.scope)

if __name__ == "__main__":
    main()
