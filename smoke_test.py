#!/usr/bin/env python3
"""Minimal smoke test: run the pipeline and verify sqlite has data."""

import os
import sys
from pathlib import Path

# Clean slate
db_path = Path(__file__).parent / "data" / "signals.db"
if db_path.exists():
    db_path.unlink()

# Run the pipeline
from main import run
run()

# Verify
import sqlite3
conn = sqlite3.connect(db_path)
count = conn.execute("SELECT COUNT(*) FROM signal_items").fetchone()[0]
conn.close()

if count > 0:
    print(f"\n✓ Smoke test passed: {count} items in database")
    sys.exit(0)
else:
    print("\n✗ Smoke test failed: no items in database")
    sys.exit(1)
