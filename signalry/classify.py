"""
LLM classifier — produces strict PRD schema.

Takes filtered signals, sends them to an LLM, returns structured
Classification objects.

Design:
- ClassifierBase: abstract interface
- MockClassifier: deterministic, for testing (no API calls)
- LLMClassifier: real classifier using Anthropic Claude API

The mock classifier uses keyword heuristics. It's not smart,
but it lets you run the full pipeline end-to-end without API keys.
"""

from __future__ import annotations

import json
import os
import re
from abc import ABC, abstractmethod
from typing import List, Optional

from .models import Signal, Classification, IntentStage, Urgency


class ClassifierBase(ABC):
    """Interface for signal classifiers."""

    @abstractmethod
    def classify(self, signal: Signal) -> Classification:
        """Produce a Classification for a single signal."""
        ...

    def classify_batch(self, signals: List[Signal]) -> List[Classification]:
        """Classify multiple signals. Default: sequential."""
        return [self.classify(s) for s in signals]


class MockClassifier(ClassifierBase):
    """
    Deterministic classifier using keyword heuristics.
    No API calls. For testing and offline development.
    """

    def classify(self, signal: Signal) -> Classification:
        text = signal.text.lower()

        # ── Intent stage ────────────────────────────────────────────
        intent = IntentStage.EXPLORING
        if any(w in text for w in ["need", "looking for", "searching", "recommend"]):
            intent = IntentStage.EVALUATING
        if any(w in text for w in ["please add", "feature request", "wish", "when will"]):
            intent = IntentStage.REQUESTING
        if any(w in text for w in ["leaving", "left", "dropped", "cancelled", "switching back"]):
            intent = IntentStage.CHURNING
        if any(w in text for w in ["love", "switched to", "started using", "best tool"]):
            intent = IntentStage.ADVOCATING

        # ── Primary pain ────────────────────────────────────────────
        pain = "general feedback"
        if any(w in text for w in ["bug", "broken", "error", "crash"]):
            pain = "reliability/bugs"
        elif any(w in text for w in ["slow", "performance", "lag"]):
            pain = "performance"
        elif any(w in text for w in ["confusing", "ux", "hard to use", "unintuitive"]):
            pain = "usability"
        elif any(w in text for w in ["price", "expensive", "cost", "pricing"]):
            pain = "pricing"
        elif any(w in text for w in ["missing", "no support for", "doesn't have"]):
            pain = "missing feature"
        elif any(w in text for w in ["scam", "rug", "honeypot", "drain"]):
            pain = "trust/security"
        elif any(w in text for w in ["token", "utility", "tokenomics"]):
            pain = "token utility"

        # ── Urgency ─────────────────────────────────────────────────
        urgency = Urgency.MEDIUM
        if any(w in text for w in ["urgent", "asap", "critical", "down", "broken now"]):
            urgency = Urgency.CRITICAL
        elif any(w in text for w in ["today", "right now", "immediately"]):
            urgency = Urgency.HIGH
        elif any(w in text for w in ["eventually", "someday", "nice to have"]):
            urgency = Urgency.LOW

        # ── Confidence (heuristic: more intent markers = higher) ───
        intent_words = ["need", "want", "looking", "please", "wish", "bug",
                        "broken", "switch", "leaving", "love", "recommend"]
        matches = sum(1 for w in intent_words if w in text)
        confidence = min(0.3 + (matches * 0.15), 0.85)

        # ── Recommended action ──────────────────────────────────────
        action = "Monitor — assess if pattern continues"
        if intent == IntentStage.CHURNING:
            action = f"Engage {signal.actor} — address {pain} before they leave"
        elif intent == IntentStage.REQUESTING:
            action = f"Log feature request: {pain} — check if this clusters"
        elif intent == IntentStage.EVALUATING:
            action = f"Respond to {signal.actor} with relevant info about {pain}"
        elif intent == IntentStage.ADVOCATING:
            action = f"Amplify — {signal.actor} is a potential champion"

        return Classification(
            signal_id=signal.id,
            intent_stage=intent,
            primary_pain=pain,
            urgency=urgency,
            confidence=round(confidence, 2),
            momentum_flag=False,  # Set by momentum module
            recommended_action=action,
        )


class LLMClassifier(ClassifierBase):
    """
    Real LLM classifier using Anthropic Claude API.

    Requires: ANTHROPIC_API_KEY environment variable.

    Sends each signal to Claude with a structured prompt,
    parses the JSON response into a Classification.
    """

    SYSTEM_PROMPT = """You are a signal intelligence agent. You analyze social media posts
and classify them according to a strict schema.

You MUST respond with valid JSON matching this exact structure:
{
  "intent_stage": "exploring|evaluating|requesting|churning|advocating",
  "primary_pain": "brief description of the core pain or need",
  "urgency": "critical|high|medium|low",
  "confidence": 0.0-1.0,
  "recommended_action": "one specific, actionable suggestion"
}

Rules:
- intent_stage: where is this person in their journey? exploring (browsing), evaluating (comparing), requesting (asking for something), churning (leaving/frustrated), advocating (promoting)
- primary_pain: what is the underlying need or frustration? Be specific, not generic.
- urgency: how time-sensitive? critical = hours, high = today, medium = this week, low = backlog
- confidence: how confident are you in this classification? 0.0-1.0
- recommended_action: what should a product/strategy person do about this? One clear action.

Context: This is for a feedback intelligence system. The posts come from X/Twitter. 
Focus on EXPLICIT intent — what the person is actually asking/doing, not vibes or sentiment.
Do NOT infer intent that isn't clearly stated."""

    def __init__(self):
        self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not self.api_key:
            raise EnvironmentError(
                "ANTHROPIC_API_KEY not set. "
                "Get one at https://console.anthropic.com/"
            )

    def classify(self, signal: Signal) -> Classification:
        try:
            import anthropic
        except ImportError:
            raise ImportError("pip install anthropic — required for LLM classification")

        client = anthropic.Anthropic(api_key=self.api_key)

        user_prompt = f"""Classify this X/Twitter post:

Author: {signal.actor}
Text: {signal.text}
Metrics: {json.dumps(signal.metrics)}
Timestamp: {signal.timestamp.isoformat()}

Respond with JSON only. No markdown, no explanation."""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=self.SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        # Parse response
        text = response.content[0].text.strip()
        # Strip markdown fences if present
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*$", "", text)

        data = json.loads(text)

        return Classification(
            signal_id=signal.id,
            intent_stage=IntentStage(data["intent_stage"]),
            primary_pain=data["primary_pain"],
            urgency=Urgency(data["urgency"]),
            confidence=float(data["confidence"]),
            momentum_flag=False,  # Set by momentum module
            recommended_action=data["recommended_action"],
        )


def get_classifier(live: bool = False) -> ClassifierBase:
    """Factory: MockClassifier for dev, LLMClassifier for production."""
    if live:
        return LLMClassifier()
    return MockClassifier()
