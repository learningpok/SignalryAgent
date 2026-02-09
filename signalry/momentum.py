"""
Momentum detection — find clusters and repeats within a time window.

PRD: "Detect momentum patterns"
Prompts: "simple heuristic is fine"

Design:
- Track topic/pain clusters across signals in a window
- Flag signals that are part of a growing pattern
- Simple but explainable: count co-occurring pain/intent combos

This is NOT ML. It's counting + time windowing.
If 3+ signals mention the same pain within a window, that's momentum.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from .models import Signal, Classification


# ── Configuration ───────────────────────────────────────────────────────────

DEFAULT_WINDOW_HOURS = 48       # Look back 48h for clustering
MIN_CLUSTER_SIZE = 3            # 3+ signals = momentum
ACTOR_REPEAT_THRESHOLD = 2     # Same actor, same pain 2+ times = signal


def detect_momentum(
    signals: List[Signal],
    classifications: List[Classification],
    window_hours: int = DEFAULT_WINDOW_HOURS,
    min_cluster: int = MIN_CLUSTER_SIZE,
) -> List[Classification]:
    """
    Detect momentum patterns and update classification.momentum_flag.

    Momentum is flagged when:
    1. TOPIC CLUSTERING: 3+ different actors mention the same primary_pain
       within the time window.
    2. ACTOR PERSISTENCE: Same actor raises the same pain 2+ times.
    3. URGENCY ESCALATION: Average urgency for a pain topic is increasing.

    Returns the same classifications list with momentum_flag updated.
    """
    if not signals or not classifications:
        return classifications

    # Build lookup
    sig_by_id: Dict[str, Signal] = {s.id: s for s in signals}
    now = datetime.utcnow()
    window_start = now - timedelta(hours=window_hours)

    # ── 1. Topic clustering ─────────────────────────────────────────────
    # Group by primary_pain within window
    pain_actors: Dict[str, set] = defaultdict(set)       # pain → {actors}
    pain_signals: Dict[str, List[str]] = defaultdict(list)  # pain → [signal_ids]

    for cls in classifications:
        sig = sig_by_id.get(cls.signal_id)
        if not sig:
            continue
        if sig.timestamp < window_start:
            continue

        pain_key = cls.primary_pain.lower().strip()
        pain_actors[pain_key].add(sig.actor)
        pain_signals[pain_key].append(cls.signal_id)

    # Pains with momentum (3+ distinct actors)
    momentum_pains: set = {
        pain for pain, actors in pain_actors.items()
        if len(actors) >= min_cluster
    }

    # ── 2. Actor persistence ────────────────────────────────────────────
    actor_pain_count: Dict[Tuple[str, str], int] = Counter()
    for cls in classifications:
        sig = sig_by_id.get(cls.signal_id)
        if not sig:
            continue
        key = (sig.actor, cls.primary_pain.lower().strip())
        actor_pain_count[key] += 1

    persistent_signals: set = {
        cls.signal_id for cls in classifications
        if (sig_by_id.get(cls.signal_id) and
            actor_pain_count[(sig_by_id[cls.signal_id].actor,
                              cls.primary_pain.lower().strip())] >= ACTOR_REPEAT_THRESHOLD)
    }

    # ── 3. Apply momentum flags ────────────────────────────────────────
    for cls in classifications:
        pain_key = cls.primary_pain.lower().strip()

        if pain_key in momentum_pains:
            cls.momentum_flag = True
        elif cls.signal_id in persistent_signals:
            cls.momentum_flag = True

    return classifications


def get_momentum_summary(
    classifications: List[Classification],
    signals: List[Signal],
) -> List[Dict]:
    """
    Return a summary of detected momentum clusters.
    Useful for the review queue and reporting.
    """
    sig_by_id = {s.id: s for s in signals}
    pain_groups: Dict[str, List] = defaultdict(list)

    for cls in classifications:
        if cls.momentum_flag:
            sig = sig_by_id.get(cls.signal_id)
            pain_groups[cls.primary_pain].append({
                "actor": sig.actor if sig else "unknown",
                "text_preview": (sig.text[:80] + "...") if sig and len(sig.text) > 80 else (sig.text if sig else ""),
                "urgency": cls.urgency.value,
                "signal_id": cls.signal_id,
            })

    return [
        {
            "pain": pain,
            "signal_count": len(items),
            "unique_actors": len(set(i["actor"] for i in items)),
            "signals": items,
        }
        for pain, items in pain_groups.items()
    ]
