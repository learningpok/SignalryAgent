from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from signalry.classify import MockClassifier
from signalry.connectors import get_registry
from signalry.connectors.realistic_mock import RealisticMockConnector
from signalry.filter import filter_signals
from signalry.models import Outcome, ResponseType
from signalry.momentum import detect_momentum, get_momentum_summary
from signalry.pipeline import Pipeline
from signalry.queue import ReviewQueue

app = FastAPI(title="Signalry API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

queue = ReviewQueue()
pipeline = Pipeline(queue=queue)
registry = get_registry()

class RunRequest(BaseModel):
    keywords: List[str] = ["bug", "feature request", "incident", "presales"]

class ChatRequest(BaseModel):
    message: str = ""

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/signals")
def list_signals(status: str = "pending", limit: int = 50):
    items = queue.list_all(limit=limit) if status == "all" else queue.list_approved(limit=limit) if status == "approved" else queue.list_pending(limit=limit)
    return {"count": len(items), "signals": [i.to_dict() for i in items]}

@app.post("/signals/run")
def run_pipeline(request: RunRequest):
    return pipeline.run(keywords=request.keywords)

@app.post("/signals/{signal_id}/approve")
def approve_signal(signal_id: str):
    items = [i for i in queue.list_all(limit=500) if i.signal.id.startswith(signal_id)]
    if not items: raise HTTPException(404, "Not found")
    queue.approve(items[0].signal.id)
    return {"status": "approved"}

@app.post("/signals/{signal_id}/discard")
def discard_signal(signal_id: str):
    items = [i for i in queue.list_all(limit=500) if i.signal.id.startswith(signal_id)]
    if not items: raise HTTPException(404, "Not found")
    queue.discard(items[0].signal.id)
    return {"status": "discarded"}

@app.get("/stats")
def get_stats():
    return queue.stats()

@app.get("/connectors")
def list_connectors():
    return {"connectors": [c.health() for c in registry.list_all()]}

@app.post("/connectors/{name}/configure")
def configure_connector(name: str, config: Dict):
    connector = registry.get(name)
    if not connector:
        raise HTTPException(404, f"Connector '{name}' not found")
    connector.configure(config)
    return connector.health()


@app.post("/chat")
def chat(request: ChatRequest):
    """Deterministic chat — parse keywords, return structured response."""
    msg = request.message.lower().strip()
    all_items = queue.list_all(limit=500)
    stats = queue.stats()

    if any(w in msg for w in ["focus", "priority", "morning", "attention", "important"]):
        resp_type = "briefing"
    elif any(w in msg for w in ["critical", "urgent", "emergency"]):
        resp_type = "critical"
    elif any(w in msg for w in ["momentum", "pattern", "cluster", "trend", "emerging"]):
        resp_type = "momentum"
    elif any(w in msg for w in ["summary", "today", "overview", "status", "recap"]):
        resp_type = "summary"
    else:
        resp_type = "summary"

    if resp_type == "briefing":
        top = all_items[:5]
        momentum_count = sum(1 for i in all_items if i.classification.momentum_flag)
        return {
            "type": "briefing",
            "message": f"I scanned {stats['total']} signals across 3 channels. Here\u2019s what needs your attention:",
            "data": {
                "signals": [i.to_dict() for i in top],
                "stats": stats,
                "momentum_count": momentum_count,
            },
        }

    if resp_type == "critical":
        critical = [i for i in all_items if i.classification.urgency in ("critical", "high")]
        return {
            "type": "briefing",
            "message": f"Found {len(critical)} critical and high-urgency signals requiring immediate attention:",
            "data": {
                "signals": [i.to_dict() for i in critical[:10]],
                "stats": stats,
                "momentum_count": sum(1 for i in critical if i.classification.momentum_flag),
            },
        }

    if resp_type == "momentum":
        momentum_items = [i for i in all_items if i.classification.momentum_flag]
        pain_groups: Dict[str, list] = {}
        for item in momentum_items:
            pain = item.classification.primary_pain
            if pain not in pain_groups:
                pain_groups[pain] = []
            pain_groups[pain].append(item.to_dict())
        clusters = [
            {
                "pain": pain,
                "signal_count": len(items),
                "unique_actors": len(set(i["signal"]["actor"] for i in items)),
                "sources": list(set(i["signal"]["source"] for i in items)),
                "signals": items,
            }
            for pain, items in pain_groups.items()
        ]
        if clusters:
            parts = [f"{c['signal_count']} signals about {c['pain']}" for c in clusters]
            message = f"I found {len(clusters)} momentum patterns forming: {', '.join(parts)}."
        else:
            message = "No momentum patterns detected yet. Try seeding signals first."
        return {
            "type": "momentum",
            "message": message,
            "data": {"clusters": clusters, "stats": stats},
        }

    # Default: summary
    top3 = all_items[:3]
    momentum_count = sum(1 for i in all_items if i.classification.momentum_flag)
    critical_count = sum(1 for i in all_items if i.classification.urgency == "critical")
    return {
        "type": "summary",
        "message": f"{stats['total']} signals in queue \u2014 {stats.get('pending', 0)} pending review, {critical_count} critical, {momentum_count} with momentum.",
        "data": {
            "signals": [i.to_dict() for i in top3],
            "stats": stats,
            "momentum_count": momentum_count,
            "critical_count": critical_count,
        },
    }


@app.get("/signals/stream")
def stream_signals(since: Optional[str] = None, limit: int = 50):
    """Return signals, optionally filtered by timestamp for polling."""
    items = queue.list_all(limit=500)
    if since:
        since_dt = datetime.fromisoformat(since)
        items = [i for i in items if i.signal.timestamp > since_dt]
    items = items[:limit]
    return {
        "count": len(items),
        "signals": [i.to_dict() for i in items],
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/signals/seed")
def seed_signals(persona: Optional[str] = None, clear: bool = False):
    """Generate a batch of realistic signals for demo purposes.

    Args:
        persona: Filter signals by persona (product/crypto/sales). Clears queue first.
        clear: If True, clear the queue before seeding.
    """
    if persona or clear:
        queue.clear()

    connector = RealisticMockConnector()
    raw_signals = connector.fetch(keywords=[], limit=50, persona=persona)

    filtered = filter_signals(raw_signals)
    classifier = MockClassifier()
    classifications = classifier.classify_batch(filtered)
    classifications = detect_momentum(filtered, classifications)

    added = 0
    dupes = 0
    for signal, cls in zip(filtered, classifications):
        if queue.add(signal, cls):
            added += 1
        else:
            dupes += 1

    momentum = get_momentum_summary(classifications, filtered)

    return {
        "seeded": added,
        "duplicates_skipped": dupes,
        "total_generated": len(raw_signals),
        "after_filter": len(filtered),
        "momentum_clusters": len(momentum),
        "momentum": momentum,
        "persona": persona,
    }
