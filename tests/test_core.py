"""
Unit tests for Signalry.

PRD requirement: "Include unit tests for filtering, schema validation,
momentum heuristic, dedup"
"""

import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta
from pathlib import Path

from signalry.models import (
    Signal, Classification, IntentStage, Urgency, ReviewItem, Outcome, ResponseType,
)
from signalry.filter import (
    filter_signals, has_explicit_intent, is_noise, meets_minimum_quality,
)
from signalry.classify import MockClassifier
from signalry.momentum import detect_momentum, get_momentum_summary
from signalry.queue import ReviewQueue


# ═══════════════════════════════════════════════════════════════════════════
# FILTERING TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestIntentDetection(unittest.TestCase):
    """Test that explicit intent is correctly identified."""

    def test_direct_request(self):
        self.assertTrue(has_explicit_intent("I need a tool to track token sentiment"))

    def test_comparison(self):
        self.assertTrue(has_explicit_intent("Comparing Nansen vs Dune for analytics"))

    def test_pain_signal(self):
        self.assertTrue(has_explicit_intent("This tool is broken, can't get any useful data"))

    def test_feature_request(self):
        self.assertTrue(has_explicit_intent("Please add real-time alerts to the dashboard"))

    def test_churn_signal(self):
        self.assertTrue(has_explicit_intent("Leaving Productboard, the feedback loop is too slow"))

    def test_crypto_intent(self):
        self.assertTrue(has_explicit_intent("When will the token launch happen? Need utility details"))

    def test_no_intent_casual(self):
        self.assertFalse(has_explicit_intent("Beautiful day in Miami, had great coffee"))

    def test_no_intent_hype(self):
        self.assertFalse(has_explicit_intent("This project is going to be huge"))


class TestNoiseDetection(unittest.TestCase):
    """Test that noise patterns are correctly caught."""

    def test_gm_spam(self):
        self.assertTrue(is_noise("gm wagmi"))

    def test_airdrop_spam(self):
        self.assertTrue(is_noise("FREE AIRDROP follow and retweet for 1000 tokens"))

    def test_engagement_bait(self):
        self.assertTrue(is_noise("Follow + Retweet to win!"))

    def test_emoji_spam(self):
        self.assertTrue(is_noise("🚀🚀🚀🚀 to the moon"))

    def test_real_post_not_noise(self):
        self.assertFalse(is_noise("I need better analytics for my token launch"))

    def test_frustration_not_noise(self):
        self.assertFalse(is_noise("The scam detection tools are completely broken"))


class TestMinimumQuality(unittest.TestCase):
    """Test minimum quality gates."""

    def test_too_short(self):
        self.assertFalse(meets_minimum_quality("hi"))

    def test_too_few_words(self):
        self.assertFalse(meets_minimum_quality("just one"))

    def test_acceptable(self):
        self.assertTrue(meets_minimum_quality("I need a tool for signal detection"))


class TestFilterPipeline(unittest.TestCase):
    """Test the full filter pipeline including dedup."""

    def _make_signal(self, text, source_id="unique", actor="user"):
        return Signal(text=text, source_id=source_id, actor=actor)

    def test_keeps_intent_signals(self):
        signals = [
            self._make_signal("I need a better analytics tool", "s1"),
            self._make_signal("Can anyone recommend a signal detector?", "s2"),
        ]
        result = filter_signals(signals)
        self.assertEqual(len(result), 2)

    def test_removes_noise(self):
        signals = [
            self._make_signal("gm wagmi 🚀🚀🚀🚀", "s1"),
            self._make_signal("FREE AIRDROP follow + retweet!", "s2"),
        ]
        result = filter_signals(signals)
        self.assertEqual(len(result), 0)

    def test_removes_no_intent(self):
        signals = [
            self._make_signal("Beautiful day in Miami, had great coffee", "s1"),
        ]
        result = filter_signals(signals)
        self.assertEqual(len(result), 0)

    def test_dedup_by_source_id(self):
        signals = [
            self._make_signal("I need a tool for detection", "same_id"),
            self._make_signal("I need a tool for detection", "same_id"),
        ]
        result = filter_signals(signals)
        self.assertEqual(len(result), 1)

    def test_dedup_different_ids_kept(self):
        signals = [
            self._make_signal("I need tool A for my project", "id_1"),
            self._make_signal("I need tool B for detection", "id_2"),
        ]
        result = filter_signals(signals)
        self.assertEqual(len(result), 2)


# ═══════════════════════════════════════════════════════════════════════════
# SCHEMA VALIDATION TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestSchemaValidation(unittest.TestCase):
    """Test that output matches strict PRD schema."""

    def test_signal_to_dict(self):
        sig = Signal(id="test", source="x", actor="user", text="hello world")
        d = sig.to_dict()
        self.assertIn("id", d)
        self.assertIn("source", d)
        self.assertIn("actor", d)
        self.assertIn("text", d)
        self.assertIn("timestamp", d)

    def test_classification_to_dict(self):
        cls = Classification(
            signal_id="test",
            intent_stage=IntentStage.EVALUATING,
            primary_pain="usability",
            urgency=Urgency.HIGH,
            confidence=0.8,
            momentum_flag=True,
            recommended_action="Respond to user",
        )
        d = cls.to_dict()
        self.assertEqual(d["intent_stage"], "evaluating")
        self.assertEqual(d["urgency"], "high")
        self.assertIsInstance(d["confidence"], float)
        self.assertIsInstance(d["momentum_flag"], bool)

    def test_classification_schema_fields(self):
        """PRD requires: intent_stage, primary_pain, urgency, confidence, momentum_flag, recommended_action"""
        cls = Classification()
        d = cls.to_dict()
        required = ["intent_stage", "primary_pain", "urgency", "confidence",
                     "momentum_flag", "recommended_action"]
        for field in required:
            self.assertIn(field, d, f"Missing PRD field: {field}")

    def test_review_item_to_dict(self):
        item = ReviewItem()
        d = item.to_dict()
        self.assertIn("signal", d)
        self.assertIn("classification", d)
        self.assertIn("status", d)

    def test_outcome_to_dict(self):
        outcome = Outcome(
            signal_id="test",
            responded=True,
            response_type=ResponseType.REPLY,
            notes="Sent DM",
        )
        d = outcome.to_dict()
        self.assertEqual(d["response_type"], "reply")
        self.assertTrue(d["responded"])

    def test_intent_stage_values(self):
        """All PRD intent stages must exist."""
        stages = [e.value for e in IntentStage]
        expected = ["exploring", "evaluating", "requesting", "churning", "advocating"]
        self.assertEqual(sorted(stages), sorted(expected))

    def test_urgency_values(self):
        levels = [e.value for e in Urgency]
        expected = ["critical", "high", "medium", "low"]
        self.assertEqual(sorted(levels), sorted(expected))


# ═══════════════════════════════════════════════════════════════════════════
# MOMENTUM HEURISTIC TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestMomentum(unittest.TestCase):
    """Test momentum detection heuristic."""

    def _make_pair(self, actor, pain, hours_ago=0):
        ts = datetime.utcnow() - timedelta(hours=hours_ago)
        sig = Signal(actor=actor, text=f"Test signal about {pain}", timestamp=ts)
        cls = Classification(signal_id=sig.id, primary_pain=pain)
        return sig, cls

    def test_no_momentum_single_signal(self):
        sig, cls = self._make_pair("user1", "reliability/bugs")
        result = detect_momentum([sig], [cls])
        self.assertFalse(result[0].momentum_flag)

    def test_momentum_three_actors_same_pain(self):
        """3+ different actors with same pain = momentum."""
        pairs = [
            self._make_pair("user1", "trust/security"),
            self._make_pair("user2", "trust/security"),
            self._make_pair("user3", "trust/security"),
        ]
        signals = [p[0] for p in pairs]
        classifications = [p[1] for p in pairs]

        result = detect_momentum(signals, classifications)
        for cls in result:
            self.assertTrue(cls.momentum_flag, "Expected momentum flag for 3-actor cluster")

    def test_no_momentum_two_actors(self):
        """2 actors = below threshold, no momentum."""
        pairs = [
            self._make_pair("user1", "pricing"),
            self._make_pair("user2", "pricing"),
        ]
        signals = [p[0] for p in pairs]
        classifications = [p[1] for p in pairs]

        result = detect_momentum(signals, classifications)
        for cls in result:
            self.assertFalse(cls.momentum_flag)

    def test_momentum_actor_persistence(self):
        """Same actor, same pain, 2+ times = momentum."""
        pairs = [
            self._make_pair("persistent_user", "reliability/bugs"),
            self._make_pair("persistent_user", "reliability/bugs"),
        ]
        signals = [p[0] for p in pairs]
        classifications = [p[1] for p in pairs]

        result = detect_momentum(signals, classifications, min_cluster=5)  # High threshold to isolate actor test
        for cls in result:
            self.assertTrue(cls.momentum_flag)

    def test_momentum_outside_window(self):
        """Signals outside time window don't count for topic clustering."""
        pairs = [
            self._make_pair("user1", "performance", hours_ago=0),
            self._make_pair("user2", "performance", hours_ago=0),
            self._make_pair("user3", "performance", hours_ago=100),  # Outside 48h window
        ]
        signals = [p[0] for p in pairs]
        classifications = [p[1] for p in pairs]

        result = detect_momentum(signals, classifications, window_hours=48, min_cluster=3)
        # Only 2 within window, should not trigger topic momentum
        in_window = [c for c, s in zip(result, signals)
                     if s.timestamp > datetime.utcnow() - timedelta(hours=48)]
        # The third one is outside window, the first two don't meet threshold
        self.assertFalse(in_window[0].momentum_flag)

    def test_momentum_summary(self):
        pairs = [
            self._make_pair("a", "trust/security"),
            self._make_pair("b", "trust/security"),
            self._make_pair("c", "trust/security"),
        ]
        signals = [p[0] for p in pairs]
        classifications = [p[1] for p in pairs]
        detect_momentum(signals, classifications)

        summary = get_momentum_summary(classifications, signals)
        self.assertEqual(len(summary), 1)
        self.assertEqual(summary[0]["pain"], "trust/security")
        self.assertEqual(summary[0]["signal_count"], 3)
        self.assertEqual(summary[0]["unique_actors"], 3)


# ═══════════════════════════════════════════════════════════════════════════
# QUEUE / DEDUP TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestReviewQueue(unittest.TestCase):
    """Test review queue including dedup."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.db_path = os.path.join(self.tmp, "test.db")
        self.queue = ReviewQueue(db_path=self.db_path)

    def test_add_and_list(self):
        sig = Signal(source_id="tw_001", actor="user1", text="test signal")
        cls = Classification(signal_id=sig.id, primary_pain="test pain")
        self.queue.add(sig, cls)

        items = self.queue.list_pending()
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].signal.actor, "user1")

    def test_dedup_by_source_id(self):
        """PRD: No duplicate interventions per actor."""
        sig1 = Signal(source_id="tw_dup", actor="user1", text="first")
        cls1 = Classification(signal_id=sig1.id)
        sig2 = Signal(source_id="tw_dup", actor="user1", text="duplicate")
        cls2 = Classification(signal_id=sig2.id)

        result1 = self.queue.add(sig1, cls1)
        result2 = self.queue.add(sig2, cls2)

        self.assertTrue(result1)
        # Second add with same source_id should not create duplicate
        items = self.queue.list_all()
        self.assertEqual(len(items), 1)

    def test_approve_and_discard(self):
        sig = Signal(source_id="tw_action", actor="user1", text="test")
        cls = Classification(signal_id=sig.id)
        self.queue.add(sig, cls)

        self.queue.approve(sig.id)
        approved = self.queue.list_approved()
        self.assertEqual(len(approved), 1)
        self.assertEqual(approved[0].status, "approved")

    def test_outcome_logging(self):
        """PRD: 100% of approved actions have recorded outcomes."""
        sig = Signal(source_id="tw_outcome", actor="user1", text="test")
        cls = Classification(signal_id=sig.id)
        self.queue.add(sig, cls)
        self.queue.approve(sig.id)

        outcome = Outcome(
            signal_id=sig.id,
            responded=True,
            response_type=ResponseType.REPLY,
            notes="Sent a DM with product info",
        )
        self.queue.log_outcome(outcome)

        retrieved = self.queue.get_outcome(sig.id)
        self.assertIsNotNone(retrieved)
        self.assertTrue(retrieved.responded)
        self.assertEqual(retrieved.response_type, ResponseType.REPLY)

    def test_stats(self):
        for i in range(5):
            sig = Signal(source_id=f"tw_stat_{i}", actor=f"user{i}", text=f"test {i}")
            cls = Classification(signal_id=sig.id)
            self.queue.add(sig, cls)

        stats = self.queue.stats()
        self.assertEqual(stats["total"], 5)
        self.assertEqual(stats["pending"], 5)


# ═══════════════════════════════════════════════════════════════════════════
# CLASSIFIER TESTS
# ═══════════════════════════════════════════════════════════════════════════

class TestMockClassifier(unittest.TestCase):
    """Test that MockClassifier produces valid schema output."""

    def setUp(self):
        self.classifier = MockClassifier()

    def test_returns_classification(self):
        sig = Signal(actor="test", text="I need a better tool for analytics")
        result = self.classifier.classify(sig)
        self.assertIsInstance(result, Classification)

    def test_evaluating_intent(self):
        sig = Signal(actor="test", text="Looking for a signal detection tool, need something reliable")
        result = self.classifier.classify(sig)
        self.assertEqual(result.intent_stage, IntentStage.EVALUATING)

    def test_requesting_intent(self):
        sig = Signal(actor="test", text="Feature request: please add real-time alerts")
        result = self.classifier.classify(sig)
        self.assertEqual(result.intent_stage, IntentStage.REQUESTING)

    def test_churning_intent(self):
        sig = Signal(actor="test", text="Leaving this platform, switching back to the old tool")
        result = self.classifier.classify(sig)
        self.assertEqual(result.intent_stage, IntentStage.CHURNING)

    def test_confidence_range(self):
        sig = Signal(actor="test", text="I need a tool that works")
        result = self.classifier.classify(sig)
        self.assertGreaterEqual(result.confidence, 0.0)
        self.assertLessEqual(result.confidence, 1.0)

    def test_recommended_action_not_empty(self):
        sig = Signal(actor="test", text="This tool is broken, need alternative")
        result = self.classifier.classify(sig)
        self.assertTrue(len(result.recommended_action) > 0)

    def test_batch_classify(self):
        signals = [
            Signal(actor="a", text="I need tool X"),
            Signal(actor="b", text="Looking for alternative to Y"),
        ]
        results = self.classifier.classify_batch(signals)
        self.assertEqual(len(results), 2)


# ═══════════════════════════════════════════════════════════════════════════
# END-TO-END PIPELINE TEST
# ═══════════════════════════════════════════════════════════════════════════

class TestPipelineEndToEnd(unittest.TestCase):
    """Test the full pipeline with mock data."""

    def test_full_run(self):
        """signal → interpretation → suggested action → outcome logging"""
        from signalry.pipeline import Pipeline
        from signalry.ingest import MockIngestor

        # Use the sample data
        data_path = Path(__file__).parent.parent / "data" / "mock_posts.json"
        if not data_path.exists():
            self.skipTest("No mock data file")

        tmp = tempfile.mkdtemp()
        db_path = os.path.join(tmp, "test_pipeline.db")

        pipe = Pipeline(
            ingestor=MockIngestor(str(data_path)),
            queue=ReviewQueue(db_path=db_path),
        )

        result = pipe.run(keywords=["need", "tool", "broken", "scam", "looking", "token", "bug", "shipping"])

        # Should have ingested, filtered, classified, and queued
        self.assertGreater(result["counts"]["ingested"], 0)
        self.assertGreater(result["counts"]["filtered"], 0)
        self.assertGreater(result["counts"]["classified"], 0)
        self.assertGreater(result["counts"]["queued"], 0)

        # Noise posts (gm wagmi, airdrop spam, coffee) should be filtered
        self.assertLess(result["counts"]["filtered"], result["counts"]["ingested"])

        # Each item should have complete schema
        for item in result["items"]:
            cls = item["classification"]
            self.assertIn(cls["intent_stage"],
                          ["exploring", "evaluating", "requesting", "churning", "advocating"])
            self.assertIn(cls["urgency"], ["critical", "high", "medium", "low"])
            self.assertIsInstance(cls["confidence"], float)
            self.assertIsInstance(cls["momentum_flag"], bool)
            self.assertTrue(len(cls["recommended_action"]) > 0)
            self.assertTrue(len(cls["primary_pain"]) > 0)


if __name__ == "__main__":
    unittest.main()
