"""
Intent filter — discard anything without explicit intent.

PRD rule: "Focus on explicit intent signals (no sentiment mining)"

This module applies fast, deterministic heuristics to separate
signals worth classifying from noise. The LLM only sees posts
that pass this gate.

Design: conservative. Better to let some noise through than to
miss a real signal. The LLM classifier is the second filter.
"""

from __future__ import annotations

import re
from typing import List, Set

from .models import Signal


# ── Intent patterns ─────────────────────────────────────────────────────────
# Each pattern indicates explicit intent (someone wants/needs/asks something).
# These are NOT sentiment words — they are action/intent markers.

INTENT_PATTERNS: List[re.Pattern] = [
    # Direct requests / needs
    re.compile(r"\b(need|looking for|searching for|want|require)\b", re.I),
    re.compile(r"\b(can anyone|does anyone|anyone know|who has|who can)\b", re.I),
    re.compile(r"\b(recommend|suggestion|alternative to|instead of)\b", re.I),

    # Evaluation / comparison
    re.compile(r"\b(comparing|vs\.?|versus|better than|switch from|migrate from)\b", re.I),
    re.compile(r"\b(thinking about|considering|evaluating|should i)\b", re.I),
    re.compile(r"\b(worth it|is it good|how is|review of)\b", re.I),

    # Pain / frustration with explicit problem
    re.compile(r"\b(broken|doesn't work|can't|cannot|impossible to|frustrated)\b", re.I),
    re.compile(r"\b(bug|issue|problem with|trouble with|struggling)\b", re.I),
    re.compile(r"\b(why (is|does|can't|won't))\b", re.I),

    # Feature requests / wishes
    re.compile(r"\b(wish|if only|would be great|please add|feature request)\b", re.I),
    re.compile(r"\b(when will|roadmap|planned|eta for)\b", re.I),

    # Adoption / churning signals
    re.compile(r"\b(just (started|switched|moved|migrated) to)\b", re.I),
    re.compile(r"\b(leaving|left|dropped|cancelled|unsubscribed)\b", re.I),
    re.compile(r"\b(going back to|returning to|switching back)\b", re.I),

    # Crypto/pump-specific intent (v1 GTM context)
    re.compile(r"\b(rug(ged)?|scam|honeypot|drain)\b", re.I),
    re.compile(r"\b(when (launch|token|airdrop|listing))\b", re.I),
    re.compile(r"\b(utility|use case|tokenomics|real product)\b", re.I),
    re.compile(r"\b(shipping|building|dev update|release)\b", re.I),
]


# ── Noise patterns (always discard) ────────────────────────────────────────

NOISE_PATTERNS: List[re.Pattern] = [
    re.compile(r"^[\s]*(gm|gn|wagmi|ngmi|lfg|bullish)[\s!.🚀🔥]*$", re.I),  # One-word hype
    re.compile(r"^(gm\s+wagmi|wagmi\s+gm)[\s!.🚀🔥]*$", re.I),          # Common combos
    re.compile(r"\b(airdrop.*free|free.*airdrop)\b", re.I),           # Spam airdrops
    re.compile(r"\b(follow.*retweet|rt.*follow|like.*follow)\b", re.I), # Engagement bait
    re.compile(r"\b\d+x\s*(gain|return|profit)\b", re.I),             # Pump hype
    re.compile(r"(🚀{3,}|🔥{3,}|💰{3,})", re.I),                    # Emoji spam
]


# ── Minimum content requirements ───────────────────────────────────────────

MIN_TEXT_LENGTH = 15        # Skip very short posts
MIN_WORD_COUNT = 3          # Need at least a few words


def has_explicit_intent(text: str) -> bool:
    """Check if text contains at least one explicit intent pattern."""
    return any(p.search(text) for p in INTENT_PATTERNS)


def is_noise(text: str) -> bool:
    """Check if text matches known noise patterns."""
    return any(p.search(text) for p in NOISE_PATTERNS)


def meets_minimum_quality(text: str) -> bool:
    """Basic quality gate: length and word count."""
    clean = text.strip()
    if len(clean) < MIN_TEXT_LENGTH:
        return False
    if len(clean.split()) < MIN_WORD_COUNT:
        return False
    return True


def filter_signals(signals: List[Signal]) -> List[Signal]:
    """
    Apply all filters. Returns only signals with explicit intent.

    Pipeline:
    1. Skip duplicates (by source_id)
    2. Skip below minimum quality
    3. Skip noise patterns
    4. Keep only posts with explicit intent

    Returns list of signals that should proceed to LLM classification.
    """
    seen_ids: Set[str] = set()
    passed: List[Signal] = []

    for signal in signals:
        # Dedup by source_id
        if signal.source_id in seen_ids:
            continue
        seen_ids.add(signal.source_id)

        # Quality gate
        if not meets_minimum_quality(signal.text):
            continue

        # Noise gate
        if is_noise(signal.text):
            continue

        # Intent gate
        if not has_explicit_intent(signal.text):
            continue

        passed.append(signal)

    return passed
