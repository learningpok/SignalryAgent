#!/usr/bin/env python3
"""
Evaluation script for signal detection.
Evaluates signal_type accuracy and priority precision@k.

Usage: python eval.py
"""

import json
from pathlib import Path

from ingest import ingest
from process import process
from store import init_db, store

DATA_FILE = Path(__file__).parent / "data" / "raw_posts.json"


def load_ground_truth() -> dict:
    """Load expected labels from raw_posts.json."""
    with open(DATA_FILE) as f:
        data = json.load(f)
    return {
        p["id"]: {
            "expected_priority": p.get("expected_priority"),
            "expected_intent": p.get("expected_intent"),
            "text": p["text"],
        }
        for p in data
    }


def run_pipeline():
    """Run full pipeline and return processed items."""
    init_db()
    raw = ingest()
    items = process(raw)
    store(items)
    return items


def precision_at_k(items, ground_truth, k: int) -> tuple[float, int]:
    """Precision@k for expected_priority == 'high'."""
    top_k = sorted(items, key=lambda x: x.priority_score, reverse=True)[:k]
    hits = sum(
        1 for item in top_k
        if ground_truth.get(item.source_id, {}).get("expected_priority") == "high"
    )
    return hits / k if k > 0 else 0.0, hits


def signal_type_accuracy(items, ground_truth) -> tuple[float, int, int, list]:
    """Signal type accuracy against expected_intent."""
    correct = 0
    mismatches = []

    for item in items:
        gt = ground_truth.get(item.source_id, {})
        expected = gt.get("expected_intent")
        predicted = item.signal_type

        if expected == predicted:
            correct += 1
        elif expected:
            mismatches.append({
                "source_id": item.source_id,
                "text": gt.get("text", item.text)[:70],
                "expected": expected,
                "predicted": predicted,
                "score": item.priority_score,
            })

    total = len([i for i in items if ground_truth.get(i.source_id, {}).get("expected_intent")])
    accuracy = correct / total if total > 0 else 0.0
    return accuracy, correct, total, mismatches


def evaluate():
    """Run evaluation."""
    print("Running pipeline...")
    items = run_pipeline()
    ground_truth = load_ground_truth()

    print(f"\nProcessed {len(items)} items\n")

    # Priority evaluation
    print("=" * 60)
    print("PRIORITY RANKING")
    print("=" * 60)

    p5, h5 = precision_at_k(items, ground_truth, 5)
    n10 = min(10, len(items))
    p10, h10 = precision_at_k(items, ground_truth, n10)

    print(f"Precision@5:  {p5:.0%} ({h5}/5)")
    print(f"Precision@10: {p10:.0%} ({h10}/{n10})")

    print("\nTop 5:")
    for i, item in enumerate(sorted(items, key=lambda x: x.priority_score, reverse=True)[:5], 1):
        gt = ground_truth.get(item.source_id, {})
        exp = gt.get("expected_priority", "?")
        mark = "✓" if exp == "high" else "✗"
        print(f"  {i}. [{mark}] {item.source_id} p={item.priority_score:.1f}")

    # Signal type evaluation
    print("\n" + "=" * 60)
    print("SIGNAL TYPE ACCURACY")
    print("=" * 60)

    acc, correct, total, mismatches = signal_type_accuracy(items, ground_truth)
    print(f"Accuracy: {acc:.0%} ({correct}/{total})")

    print("\nPredictions:")
    for item in sorted(items, key=lambda x: x.priority_score, reverse=True):
        gt = ground_truth.get(item.source_id, {})
        exp = gt.get("expected_intent", "?")
        mark = "✓" if exp == item.signal_type else "✗"
        print(f"  [{mark}] {item.source_id}: {item.signal_type}")
        if exp != item.signal_type and exp != "?":
            print(f"       expected: {exp}")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    evaluate()
