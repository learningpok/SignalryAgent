"""Tests for the RealisticMockConnector."""

import os
import tempfile
import unittest
from collections import defaultdict
from datetime import datetime, timedelta

from signalry.connectors.realistic_mock import RealisticMockConnector
from signalry.classify import MockClassifier
from signalry.filter import filter_signals
from signalry.models import Signal
from signalry.momentum import detect_momentum, get_momentum_summary
from signalry.queue import ReviewQueue


class TestRealisticMockConnector(unittest.TestCase):
    """Tests for realistic mock data generation."""

    def setUp(self):
        self.connector = RealisticMockConnector()
        self.signals = self.connector.fetch(keywords=[])

    def test_fetch_returns_signals(self):
        """Connector returns a non-empty list of Signal objects."""
        self.assertGreater(len(self.signals), 0)
        for s in self.signals:
            self.assertIsInstance(s, Signal)

    def test_signal_count(self):
        """Pool has at least 25 signals."""
        self.assertGreaterEqual(len(self.signals), 25)

    def test_signal_diversity_sources(self):
        """Signals span 3 sources: intercom, slack, hubspot."""
        sources = set(s.source for s in self.signals)
        self.assertGreaterEqual(len(sources), 3)
        for expected in ["intercom", "slack", "hubspot"]:
            self.assertIn(expected, sources)

    def test_signal_diversity_actors(self):
        """Signals include at least 5 unique actors."""
        actors = set(s.actor for s in self.signals)
        self.assertGreaterEqual(len(actors), 5)

    def test_timestamps_within_72h(self):
        """All signal timestamps are within the last 72 hours."""
        now = datetime.utcnow()
        cutoff = now - timedelta(hours=73)  # Small buffer
        for s in self.signals:
            self.assertGreater(s.timestamp, cutoff,
                               f"Signal {s.id} timestamp too old: {s.timestamp}")

    def test_unique_source_ids(self):
        """All signals have unique source_ids for dedup."""
        source_ids = [s.source_id for s in self.signals]
        self.assertEqual(len(source_ids), len(set(source_ids)))

    def test_all_signals_pass_filter(self):
        """All generated signals pass through the intent filter."""
        filtered = filter_signals(self.signals)
        self.assertEqual(len(filtered), len(self.signals),
                         "Some signals were filtered out — check intent patterns")

    def test_momentum_clusters(self):
        """Running through pipeline produces at least 2 momentum clusters."""
        filtered = filter_signals(self.signals)
        classifier = MockClassifier()
        classifications = classifier.classify_batch(filtered)
        classifications = detect_momentum(filtered, classifications)
        summary = get_momentum_summary(classifications, filtered)
        self.assertGreaterEqual(len(summary), 2,
                                f"Expected 2+ clusters, got {len(summary)}: "
                                f"{[c['pain'] for c in summary]}")

    def test_cross_channel_correlation(self):
        """Same pain topic appears from signals with different sources."""
        filtered = filter_signals(self.signals)
        classifier = MockClassifier()
        classifications = classifier.classify_batch(filtered)

        # Group by pain, collect sources
        pain_sources: dict = defaultdict(set)
        for sig, cls in zip(filtered, classifications):
            pain_sources[cls.primary_pain].add(sig.source)

        # At least 2 pain topics have signals from 2+ sources
        cross_channel = [
            pain for pain, sources in pain_sources.items()
            if len(sources) >= 2
        ]
        self.assertGreaterEqual(len(cross_channel), 2,
                                f"Expected 2+ cross-channel pains, got: {cross_channel}")

    def test_fetch_with_since(self):
        """Since parameter filters out older signals."""
        since = datetime.utcnow() - timedelta(hours=10)
        recent = self.connector.fetch(keywords=[], since=since)
        self.assertLess(len(recent), len(self.signals),
                        "Since filter should return fewer signals")
        for s in recent:
            self.assertGreater(s.timestamp, since)

    def test_fetch_with_limit(self):
        """Limit parameter caps returned signals."""
        limited = self.connector.fetch(keywords=[], limit=5)
        self.assertEqual(len(limited), 5)

    def test_fetch_with_keywords(self):
        """Keywords parameter filters signals by text content."""
        api_signals = self.connector.fetch(keywords=["API"])
        self.assertGreater(len(api_signals), 0)
        for s in api_signals:
            self.assertIn("api", s.text.lower())

    def test_full_schema_classification(self):
        """Every classified signal has the complete PRD schema."""
        filtered = filter_signals(self.signals)
        classifier = MockClassifier()
        classifications = classifier.classify_batch(filtered)

        for cls in classifications:
            d = cls.to_dict()
            for field in ["signal_id", "intent_stage", "primary_pain",
                          "urgency", "confidence", "momentum_flag",
                          "recommended_action"]:
                self.assertIn(field, d, f"Missing field: {field}")
            self.assertIn(d["intent_stage"],
                          ["exploring", "evaluating", "requesting",
                           "churning", "advocating"])
            self.assertIn(d["urgency"],
                          ["critical", "high", "medium", "low"])
            self.assertGreaterEqual(d["confidence"], 0.0)
            self.assertLessEqual(d["confidence"], 1.0)
            self.assertTrue(d["recommended_action"],
                            "recommended_action should not be empty")

    def test_pipeline_integration(self):
        """Signals flow through the full pipeline into the review queue."""
        filtered = filter_signals(self.signals)
        classifier = MockClassifier()
        classifications = classifier.classify_batch(filtered)
        classifications = detect_momentum(filtered, classifications)

        # Use a temp file since ReviewQueue opens new connections per operation
        fd, tmp_path = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        try:
            q = ReviewQueue(db_path=tmp_path)
            added = 0
            for signal, cls in zip(filtered, classifications):
                if q.add(signal, cls):
                    added += 1

            self.assertGreater(added, 0, "No signals were added to the queue")

            # Verify queue contents
            pending = q.list_pending(limit=100)
            self.assertEqual(len(pending), added)

            # Verify momentum flags exist in queue
            momentum_items = [i for i in pending if i.classification.momentum_flag]
            self.assertGreater(len(momentum_items), 0,
                               "Queue should contain momentum-flagged items")

            stats = q.stats()
            self.assertGreater(stats["momentum_flags"], 0)
        finally:
            os.unlink(tmp_path)

    def test_empty_data_path(self):
        """Connector returns empty list when data file doesn't exist."""
        connector = RealisticMockConnector(data_path="nonexistent.json")
        signals = connector.fetch(keywords=[])
        self.assertEqual(signals, [])

    def test_health_check(self):
        """Health check returns expected fields."""
        health = self.connector.health()
        self.assertEqual(health["name"], "realistic_mock")
        self.assertEqual(health["mode"], "pull")
        self.assertEqual(health["status"], "connected")
        self.assertIn("pool_size", health)
        self.assertGreater(health["pool_size"], 0)


if __name__ == "__main__":
    unittest.main()
