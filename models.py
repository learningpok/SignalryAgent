from dataclasses import dataclass, field
from datetime import datetime
from typing import List

@dataclass
class RawPost:
    """Raw post as ingested from source."""
    id: str
    text: str
    author: str
    timestamp: str
    likes: int = 0
    reposts: int = 0

@dataclass
class SignalItem:
    """Processed item with explainable priority score."""
    id: str
    source_id: str
    text: str
    author: str
    timestamp: datetime

    # Classifications
    format: str           # thread | question | announcement | general
    signal_type: str      # feedback_improvement | incident_bug | feature_request_use_case | launch_update | spam_noise

    # Priority scoring
    priority_score: float
    severity_score: float      # 0-100
    recurrence_score: float    # 0-100
    business_weight: float     # 0-100

    # Business context
    account_tier: str          # enterprise | growth | standard
    
    # Explainability
    reasons: List[str] = field(default_factory=list)
    
    # PRD: Recommended action
    recommended_action: str = "No action recommended"
