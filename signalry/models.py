"""
Signalry data models — strict PRD schema.

Signal → Classification → Outcome
No extra fields. No drift.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Optional


# ── Enums matching PRD exactly ──────────────────────────────────────────────

class IntentStage(str, Enum):
    """Where the actor is in their decision/feedback journey."""
    EXPLORING = "exploring"          # Looking around, comparing options
    EVALUATING = "evaluating"        # Actively assessing, asking questions
    REQUESTING = "requesting"        # Explicit ask for feature/fix/change
    CHURNING = "churning"            # Signaling departure or frustration
    ADVOCATING = "advocating"        # Promoting, recommending to others


class Urgency(str, Enum):
    """How time-sensitive is this signal."""
    CRITICAL = "critical"    # Needs attention within hours
    HIGH = "high"            # Within a day
    MEDIUM = "medium"        # This week
    LOW = "low"              # Backlog-worthy


class ResponseType(str, Enum):
    """PRD outcome types."""
    REPLY = "reply"
    FOLLOW_UP = "follow_up"
    NONE = "none"


# ── Core Data Structures ────────────────────────────────────────────────────

@dataclass
class Signal:
    """Raw ingested signal — PRD spec."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source: str = "x"                # Platform: "x" for v1
    actor: str = ""                  # Username / handle
    text: str = ""                   # Raw post text
    timestamp: datetime = field(default_factory=datetime.utcnow)
    # Metadata for dedup + context
    source_id: str = ""              # Platform-native ID (tweet ID)
    reply_to: Optional[str] = None   # Parent tweet ID if reply
    metrics: dict = field(default_factory=dict)  # likes, retweets, etc.

    def to_dict(self) -> dict:
        d = asdict(self)
        d["timestamp"] = self.timestamp.isoformat()
        return d


@dataclass
class Classification:
    """LLM-produced classification — strict PRD schema."""
    signal_id: str = ""
    intent_stage: IntentStage = IntentStage.EXPLORING
    primary_pain: str = ""           # Free-text: the core pain/need identified
    urgency: Urgency = Urgency.MEDIUM
    confidence: float = 0.0          # 0.0–1.0
    momentum_flag: bool = False      # Is this part of a cluster/trend?
    recommended_action: str = ""     # One clear action suggestion

    def to_dict(self) -> dict:
        d = asdict(self)
        d["intent_stage"] = self.intent_stage.value
        d["urgency"] = self.urgency.value
        return d


@dataclass
class ReviewItem:
    """A signal + its classification, queued for human review."""
    signal: Signal = field(default_factory=Signal)
    classification: Classification = field(default_factory=Classification)
    status: str = "pending"          # pending | approved | discarded
    reviewed_at: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "signal": self.signal.to_dict(),
            "classification": self.classification.to_dict(),
            "status": self.status,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


@dataclass
class Outcome:
    """PRD outcome log — records what happened after approval."""
    signal_id: str = ""
    responded: bool = False
    response_type: ResponseType = ResponseType.NONE
    notes: str = ""
    logged_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        d = asdict(self)
        d["response_type"] = self.response_type.value
        d["logged_at"] = self.logged_at.isoformat()
        return d
