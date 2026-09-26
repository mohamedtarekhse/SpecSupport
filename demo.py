#!/usr/bin/env python3
"""
Inspecta - Interactive QA/QC AI Demo Script
Run this script to demonstrate real-time queries against Inspecta's AI standards engine.

Usage:
    python demo.py
"""

import sys
import time
import json
import urllib.request
import urllib.error

CLOUD_ENDPOINT = "https://inspection-api.mohamedtarekhse.workers.dev/api/ask"
LOCAL_ENDPOINT = "http://localhost:5000/api/ask"

SAMPLE_QUERIES = [
    {
        "title": "Sour Service Hardness Limits",
        "question": "What is the maximum allowable hardness for casing in sour service per NACE MR0175 and API 5CT?",
        "standard_filter": "API 5CT"
    },
    {
        "title": "Radiographic Density Limits",
        "question": "What are the minimum and maximum acceptable optical density limits for X-ray and Gamma-ray film per ASME Section V Article 2?",
        "standard_filter": "ASME V"
    },
    {
        "title": "Pipeline Undercut Acceptance",
        "question": "What is the maximum allowable undercut length and depth under API 1104 for cross-country pipelines?",
        "standard_filter": "API 1104"
    },
    {
        "title": "BOP Testing Intervals",
        "question": "How often must blow-out preventer (BOP) rams be pressure tested according to API Standard 53?",
        "standard_filter": "API 53"
    },
    {
        "title": "Arabic Oilfield Technical Query",
        "question": "ما هي حدود قبول عدم النفاذ في لحام خطوط الأنابيب وفقا لمواصفة API 1104؟",
        "standard_filter": "API 1104"
    }
]

def print_banner():
    print("=" * 75)
    print("    INSPECTA - AI Standards & NDT Engineering Assistant")
    print("    Deterministic, Zero-Hallucination Oil & Gas Inspection Engine")
    print("=" * 75)

def query_inspecta(endpoint, question, standard_filter="ALL", language="en"):
    payload = {
        "question": question,
        "language": language,
        "session_id": "demo_console_user",
        "standard_filter": standard_filter,
        "history": []
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "InspectaDemo/1.0"}
    )
    
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            elapsed = time.time() - start_time
            res_body = resp.read().decode('utf-8')
            return json.loads(res_body), elapsed, resp.status
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start_time
        err_msg = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_msg)
            return err_json, elapsed, e.code
        except Exception:
            return {"error": err_msg}, elapsed, e.code
    except Exception as e:
        elapsed = time.time() - start_time
        return {"error": str(e)}, elapsed, 0

def display_result(result, elapsed, status):
    print("\n" + "-" * 75)
    if status == 200:
        model_used = result.get('model_used', 'N/A')
        sources = result.get('sources', [])
        answer = result.get('answer', 'No answer received.')
        
        print(f" [STATUS: OK 200]  |  Latency: {elapsed:.2f}s  |  Model: {model_used}")
        print("-" * 75)
        print("\n" + answer.strip() + "\n")
        
        if sources:
            print("-" * 75)
            print(" Verified Sources Cited:")
            for s in sources:
                print(f"   * {s}")
    elif status == 429:
        print(f" [STATUS: RATE LIMITED 429] (Latency: {elapsed:.2f}s)")
        print(f" Notice: {result.get('error', 'Rate limit exceeded')}")
        print(" Tip: Configure your Groq or OpenRouter API key in the Admin Panel to lift shared limits.")
    else:
        print(f" [STATUS ERROR {status}] (Latency: {elapsed:.2f}s)")
        print(f" Error: {result.get('error', 'Unknown server error')}")
    print("-" * 75 + "\n")

def run_sample_showcase(endpoint):
    print(f"\nRunning Automated Showcase against: {endpoint}\n")
    for idx, item in enumerate(SAMPLE_QUERIES, 1):
        print(f"[{idx}/{len(SAMPLE_QUERIES)}] Query: {item['title']}")
        print(f"      Q: \"{item['question']}\"")
        print(f"      Filter: [{item['standard_filter']}]")
        print("      Submitting to AI pipeline...")
        
        lang = "ar" if "ما" in item['question'] else "en"
        result, elapsed, status = query_inspecta(endpoint, item['question'], item['standard_filter'], lang)
        display_result(result, elapsed, status)
        
        if idx < len(SAMPLE_QUERIES):
            time.sleep(1.5)

def run_interactive_mode(endpoint):
    print(f"\nInteractive Mode active against: {endpoint}")
    print("Type your inspection question below (or 'exit' to quit):\n")
    
    while True:
        try:
            q = input("Inspecta > ").strip()
            if not q:
                continue
            if q.lower() in ['exit', 'quit', 'q']:
                print("Exiting demo. Goodbye!")
                break
            
            lang = "ar" if any('\u0600' <= c <= '\u06FF' for c in q) else "en"
            print("Thinking and searching standards...")
            result, elapsed, status = query_inspecta(endpoint, q, "ALL", lang)
            display_result(result, elapsed, status)
        except (KeyboardInterrupt, EOFError):
            print("\nExiting demo. Goodbye!")
            break

def main():
    print_banner()
    
    # Check if local endpoint is active
    target_endpoint = CLOUD_ENDPOINT
    print("\nSelect Target Backend:")
    print("  [1] Cloudflare Edge API (Live Online Production)")
    print("  [2] LocaSpec Local Python Server (http://localhost:5000)")
    
    choice = input("\nSelect [1 or 2] (Default 1): ").strip()
    if choice == '2':
        target_endpoint = LOCAL_ENDPOINT
        print(f"-> Using Local Server: {target_endpoint}")
    else:
        print(f"-> Using Cloudflare Edge Server: {target_endpoint}")
        
    print("\nSelect Run Mode:")
    print("  [1] Run Sample Showcase (5 Curated Inspection Queries)")
    print("  [2] Interactive Mode (Ask any custom question)")
    
    mode_choice = input("\nSelect [1 or 2] (Default 1): ").strip()
    if mode_choice == '2':
        run_interactive_mode(target_endpoint)
    else:
        run_sample_showcase(target_endpoint)

if __name__ == '__main__':
    main()
