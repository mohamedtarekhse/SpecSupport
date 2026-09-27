#!/usr/bin/env python3
"""
Executes all IADC SQL batch files directly to Cloudflare D1 using Wrangler.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

# Force UTF-8 for console output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BATCH_DIR = Path("scripts/iadc_sql_batches")
CONFIG_FILE = "worker/wrangler.toml"
DB_NAME = "inspection-db"

def main():
    sql_files = sorted(BATCH_DIR.glob("*.sql"))
    if not sql_files:
        print("No SQL batch files found.")
        sys.exit(1)

    print(f"Found {len(sql_files)} SQL batch files to execute against Cloudflare D1...")
    t0 = time.time()

    for idx, fpath in enumerate(sql_files):
        print(f"\n[{idx+1}/{len(sql_files)}] Executing {fpath.name} ({fpath.stat().st_size:,} bytes)...")
        cmd = f'cmd.exe /c "npx wrangler d1 execute {DB_NAME} --config {CONFIG_FILE} --remote --file={fpath}"'
        
        retries = 3
        success = False
        while retries > 0 and not success:
            res = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
            if res.returncode == 0:
                print(f"  [OK] {fpath.name} executed successfully!")
                success = True
            else:
                print(f"  [ERROR] Error executing {fpath.name}: {res.stderr or res.stdout}")
                retries -= 1
                if retries > 0:
                    print(f"  Retrying in 3 seconds... ({retries} attempts left)")
                    time.sleep(3)
        
        if not success:
            print(f"[FAILED] Failed to execute {fpath.name}. Aborting.")
            sys.exit(1)

    print(f"\nAll {len(sql_files)} batches successfully executed into Cloudflare D1 in {time.time()-t0:.1f}s!")

if __name__ == "__main__":
    main()
