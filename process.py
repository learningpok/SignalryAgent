import hashlib
import math
import re
from datetime import datetime

from models import RawPost, SignalItem

MIN_TEXT_LENGTH = 10

# Priority score weights
W_SEVERITY = 0.45
W_RECURRENCE = 0.30
W_BUSINESS = 0.25

# Format detection
THREAD_MARKERS = {"1/", "thread", "a]", "1)", "1."}
ACTION_KEYWORDS = {"shipped", "built", "launched", "released", "deployed", "created", "implemented"}

# Signal type keywords
SPAM_PATTERNS = {"follow for follow", "f4f", "gm", "gn", "like4like", "check my", "dm me"}

INCIDENT_BUG_KEYWORDS = {"bug", "broken", "error", "crash", "fail", "issue", "problem", "doesn't work", "can't", "unable", "stuck", "down", "outage"}
FEEDBACK_KEYWORDS = {"love", "great", "works well", "amazing", "helpful", "useful", "recommend", "switched to", "using", "adopted", "our stack", "power users"}
FEATURE_REQUEST_KEYWORDS = {"wish", "would be nice", "looking for", "need", "want", "missing", "should have", "feature request", "any tool", "alternative"}
LAUNCH_KEYWORDS = {"shipped", "launched", "released", "introducing", "announcing", "just built", "now live", "deployed", "new feature"}

# Business weight by signal type
BUSINESS_WEIGHTS = {
    "launch_update": 100,
    "incident_bug": 85,
    "feedback_improvement": 70,
    "feature_request_use_case": 55,
    "spam_noise": 0,
}


def process(posts: list[RawPost]) -> list[SignalItem]:
    """Filter noise and convert to SignalItems with priority scores."""
    items = []
    for post in posts:
        text = post.text.strip()
        if len(text) < MIN_TEXT_LENGTH:
            continue

        result = _compute_all(post)
        if result["priority_score"] <= 0:
            continue

        # Generate recommended action (PRD requirement)
        recommended_action = _generate_recommended_action(
            result["signal_type"],
            result["priority_score"],
            post.text
        )
        
        items.append(
            SignalItem(
                id=_generate_id(post),
                source_id=post.id,
                text=text,
                author=post.author,
                timestamp=_parse_timestamp(post.timestamp),
                format=result["format"],
                signal_type=result["signal_type"],
                priority_score=result["priority_score"],
                severity_score=result["severity_score"],
                recurrence_score=result["recurrence_score"],
                business_weight=result["business_weight"],
                account_tier=result["account_tier"],
                reasons=result["reasons"],
                recommended_action=recommended_action,
            )
        )

    return items


def _compute_all(post: RawPost) -> dict:
    """Compute all scores and classifications."""
    text_lower = post.text.lower()

    # Classifications
    format_type = _classify_format(text_lower, post.text)
    signal_type = _classify_signal_type(text_lower)

    # Sub-scores
    severity = _compute_severity(post)
    recurrence = _compute_recurrence(text_lower)
    business = BUSINESS_WEIGHTS.get(signal_type, 50)

    # Account tier (placeholder - would come from CRM/user data)
    account_tier = _infer_account_tier(post)

    # Priority score
    priority = (
        W_SEVERITY * severity +
        W_RECURRENCE * recurrence +
        W_BUSINESS * business
    )

    # Spam penalty
    if signal_type == "spam_noise":
        priority = max(0, priority - 50)

    reasons = _build_reasons(severity, recurrence, business, signal_type, post)

    return {
        "format": format_type,
        "signal_type": signal_type,
        "priority_score": round(priority, 1),
        "severity_score": round(severity, 1),
        "recurrence_score": round(recurrence, 1),
        "business_weight": round(business, 1),
        "account_tier": account_tier,
        "reasons": reasons,
    }


def _compute_severity(post: RawPost) -> float:
    """Severity based on engagement. Log-scaled, 0-100."""
    raw = post.likes + (post.reposts * 2)
    if raw == 0:
        return 0.0
    return min(math.log10(raw + 1) * 25, 100)


def _compute_recurrence(text_lower: str) -> float:
    """Recurrence score based on structural patterns. 0-100."""
    score = 0.0

    if any(marker in text_lower for marker in THREAD_MARKERS):
        score += 30
    if re.search(r'\d[.):]\s', text_lower):
        score += 15
    if any(w in text_lower for w in ["but ", "however", "although", "instead"]):
        score += 10
    if re.search(r'\d+%|\d+x|\d+ (users|customers|people)', text_lower):
        score += 25
    if any(w in text_lower for w in ["i learned", "we found", "after", "when i", "when we"]):
        score += 20

    return min(score, 100)


def _classify_format(text_lower: str, text: str) -> str:
    """Classify format: thread | question | announcement | general."""
    if any(marker in text_lower for marker in THREAD_MARKERS):
        return "thread"
    if text.strip().endswith("?"):
        return "question"
    if any(k in text_lower for k in ACTION_KEYWORDS):
        return "announcement"
    return "general"


def _classify_signal_type(text_lower: str) -> str:
    """Classify signal type."""
    # Spam first
    if any(p in text_lower for p in SPAM_PATTERNS):
        return "spam_noise"

    # Count hits
    incident_hits = sum(1 for k in INCIDENT_BUG_KEYWORDS if k in text_lower)
    feedback_hits = sum(1 for k in FEEDBACK_KEYWORDS if k in text_lower)
    feature_hits = sum(1 for k in FEATURE_REQUEST_KEYWORDS if k in text_lower)
    launch_hits = sum(1 for k in LAUNCH_KEYWORDS if k in text_lower)

    scores = [
        (launch_hits, "launch_update"),
        (incident_hits, "incident_bug"),
        (feedback_hits, "feedback_improvement"),
        (feature_hits, "feature_request_use_case"),
    ]

    best = max(scores, key=lambda x: x[0])
    if best[0] > 0:
        return best[1]

    # Fallbacks
    if re.search(r'\d+ (users|customers|people)|\d+[kmb]\s*(users|arr|mrr)', text_lower):
        return "feedback_improvement"
    if (
        any(seg in text_lower for seg in ["power users", "advanced users", "heavy users", "teams"])
        and any(verb in text_lower for verb in ["use", "using", "adopted", "rely", "depend"])
    ):
        return "feedback_improvement"

    return "feature_request_use_case"  # Default for substantive content


def _infer_account_tier(post: RawPost) -> str:
    """Infer account tier from engagement. Placeholder logic."""
    total = post.likes + post.reposts
    if total > 500:
        return "enterprise"
    elif total > 100:
        return "growth"
    return "standard"


def _build_reasons(severity: float, recurrence: float, business: float,
                   signal_type: str, post: RawPost) -> list[str]:
    """Build explanation reasons."""
    reasons = []

    contributions = [
        (severity * W_SEVERITY, f"severity: {post.likes} likes, {post.reposts} reposts"),
        (recurrence * W_RECURRENCE, f"recurrence: structural patterns"),
        (business * W_BUSINESS, f"business: {signal_type}"),
    ]
    contributions.sort(reverse=True, key=lambda x: x[0])

    for score, reason in contributions[:2]:
        if score > 0:
            reasons.append(f"+{reason}")

    if signal_type == "spam_noise":
        reasons.append("-spam detected")

    return reasons


def _parse_timestamp(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def _generate_id(post: RawPost) -> str:
    return hashlib.sha256(f"{post.id}:{post.author}".encode()).hexdigest()[:12]


def _generate_recommended_action(signal_type: str, priority_score: float, text: str) -> str:
    """
    Generate a recommended action based on signal type and priority
    
    PRD Requirement: "Agent proposes a recommended action"
    """
    
    # High priority actions (score > 60)
    if priority_score > 60:
        if signal_type == "incident_bug":
            return "Escalate to engineering immediately"
        elif signal_type == "feedback_improvement":
            return "Schedule user interview to understand pain"
        elif signal_type == "feature_request_use_case":
            return "Add to feature backlog with high priority"
        elif signal_type == "launch_update":
            return "Share internally + monitor engagement"
        else:
            return "DM author directly to understand context"
    
    # Medium priority actions (40-60)
    elif priority_score > 40:
        if signal_type == "incident_bug":
            return "Add to bug tracker"
        elif signal_type == "feedback_improvement":
            return "Add to improvement backlog"
        elif signal_type == "feature_request_use_case":
            return "Monitor for recurrence"
        elif signal_type == "launch_update":
            return "Track for momentum"
        else:
            return "Monitor weekly digest"
    
    # Low priority actions (< 40)
    else:
        return "Archive - no immediate action needed"


def _generate_recommended_action(signal_type: str, priority_score: float, text: str) -> str:
    """
    Generate a recommended action based on signal type and priority
    
    PRD Requirement: "Agent proposes a recommended action"
    """
    
    # High priority actions (score > 60)
    if priority_score > 60:
        if signal_type == "incident_bug":
            return "Escalate to engineering immediately"
        elif signal_type == "feedback_improvement":
            return "Schedule user interview to understand pain"
        elif signal_type == "feature_request_use_case":
            return "Add to feature backlog with high priority"
        elif signal_type == "launch_update":
            return "Share internally + monitor engagement"
        else:
            return "DM author directly to understand context"
    
    # Medium priority actions (40-60)
    elif priority_score > 40:
        if signal_type == "incident_bug":
            return "Add to bug tracker"
        elif signal_type == "feedback_improvement":
            return "Add to improvement backlog"
        elif signal_type == "feature_request_use_case":
            return "Monitor for recurrence"
        elif signal_type == "launch_update":
            return "Track for momentum"
        else:
            return "Monitor weekly digest"
    
    # Low priority actions (< 40)
    else:
        return "Archive - no immediate action needed"


def _generate_recommended_action(signal_type: str, priority_score: float, text: str) -> str:
    """
    Generate a recommended action based on signal type and priority
    
    PRD Requirement: "Agent proposes a recommended action"
    """
    
    # High priority actions (score > 60)
    if priority_score > 60:
        if signal_type == "incident_bug":
            return "Escalate to engineering immediately"
        elif signal_type == "feedback_improvement":
            return "Schedule user interview to understand pain"
        elif signal_type == "feature_request_use_case":
            return "Add to feature backlog with high priority"
        elif signal_type == "launch_update":
            return "Share internally + monitor engagement"
        else:
            return "DM author directly to understand context"
    
    # Medium priority actions (40-60)
    elif priority_score > 40:
        if signal_type == "incident_bug":
            return "Add to bug tracker"
        elif signal_type == "feedback_improvement":
            return "Add to improvement backlog"
        elif signal_type == "feature_request_use_case":
            return "Monitor for recurrence"
        elif signal_type == "launch_update":
            return "Track for momentum"
        else:
            return "Monitor weekly digest"
    
    # Low priority actions (< 40)
    else:
        return "Archive - no immediate action needed"
