#!/usr/bin/env python3
"""
Signalry: Detect signal from noisy inputs.

Usage: python main.py
"""

from ingest import ingest
from process import process
from store import init_db, store
from surface import surface


def run():
    init_db()

    raw = ingest()
    print(f"Ingested {len(raw)} raw posts")

    items = process(raw)
    print(f"Processed into {len(items)} signal items")

    store(items)
    print("Stored to database")

    surface(n=5)


if __name__ == "__main__":
    run()
