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
    keywords: List[str] = ["pump", "token", "need", "broken", "scam"]

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
def seed_signals():
    """Generate a batch of realistic signals for demo purposes."""
    connector = RealisticMockConnector()
    raw_signals = connector.fetch(keywords=[], limit=30)

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
    }
