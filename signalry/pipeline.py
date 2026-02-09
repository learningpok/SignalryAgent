"""
Signalry pipeline — the core loop.

signal → interpretation → suggested action → outcome logging

This is the atomic unit of the product.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from .models import Signal, Classification, ReviewItem
from .ingest import IngestorBase, get_ingestor
from .filter import filter_signals
from .classify import ClassifierBase, get_classifier
from .momentum import detect_momentum, get_momentum_summary
from .queue import ReviewQueue


class Pipeline:
    """
    End-to-end signal processing pipeline.

    Usage:
        pipe = Pipeline()
        result = pipe.run(keywords=["pump", "token", "shipping"])
        print(result["stats"])
    """

    def __init__(
        self,
        ingestor: Optional[IngestorBase] = None,
        classifier: Optional[ClassifierBase] = None,
        queue: Optional[ReviewQueue] = None,
        live: bool = False,
    ):
        self.ingestor = ingestor or get_ingestor(live=live)
        self.classifier = classifier or get_classifier(live=live)
        self.queue = queue or ReviewQueue()

    def run(
        self,
        keywords: List[str],
        since: Optional[datetime] = None,
    ) -> Dict:
        """
        Execute the full pipeline:
        1. Ingest raw signals
        2. Filter for explicit intent
        3. Classify each signal
        4. Detect momentum
        5. Queue for human review

        Returns summary dict with counts and items.
        """
        # 1. Ingest
        raw_signals = self.ingestor.fetch(keywords=keywords, since=since)

        # 2. Filter
        filtered = filter_signals(raw_signals)

        # 3. Classify
        classifications = self.classifier.classify_batch(filtered)

        # 4. Momentum
        classifications = detect_momentum(filtered, classifications)

        # 5. Queue for review
        added = 0
        dupes = 0
        for signal, cls in zip(filtered, classifications):
            if self.queue.add(signal, cls):
                added += 1
            else:
                dupes += 1

        # Build result
        momentum_summary = get_momentum_summary(classifications, filtered)
        queue_stats = self.queue.stats()

        return {
            "run_at": datetime.utcnow().isoformat(),
            "counts": {
                "ingested": len(raw_signals),
                "filtered": len(filtered),
                "classified": len(classifications),
                "queued": added,
                "duplicates_skipped": dupes,
            },
            "momentum": momentum_summary,
            "queue_stats": queue_stats,
            "items": [
                ReviewItem(signal=s, classification=c).to_dict()
                for s, c in zip(filtered, classifications)
            ],
        }
