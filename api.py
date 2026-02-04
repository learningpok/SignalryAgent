from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from store import get_top_items
from feedback_store import save_feedback, get_all_feedback

app = FastAPI(title="Signalry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeedbackInput(BaseModel):
    signal_id: str
    feedback_type: str  # "positive" or "negative"

@app.get("/signals")
def list_signals(limit: int = 20):
    items = get_top_items(limit)
    return [item.__dict__ for item in items]

@app.post("/feedback")
def submit_feedback(feedback: FeedbackInput):
    if feedback.feedback_type not in ["positive", "negative"]:
        raise HTTPException(status_code=400, detail="feedback_type must be 'positive' or 'negative'")
    
    result = save_feedback(feedback.signal_id, feedback.feedback_type)
    return {"status": "success", "data": result}

@app.get("/feedback")
def list_feedback():
    return get_all_feedback()


# Outcome logging (PRD requirement)
from outcome_store import save_outcome, get_all_outcomes, get_outcome_metrics

@app.post("/outcome")
def log_outcome(data: dict):
    """
    Log outcome for a signal (PRD User Flow step 7)
    
    Expected: {
        "signal_id": str,
        "acted": bool,
        "response_type": "reply" | "follow_up" | "none",
        "notes": str
    }
    """
    signal_id = data.get("signal_id")
    acted = data.get("acted")
    response_type = data.get("response_type", "none")
    notes = data.get("notes", "")
    
    if not signal_id or acted is None:
        return {"success": False, "error": "Missing signal_id or acted"}
    
    save_outcome(signal_id, acted, response_type, notes)
    return {"success": True}


@app.get("/outcomes")
def list_outcomes():
    """List all logged outcomes"""
    return get_all_outcomes()


@app.get("/metrics")
def get_metrics():
    """
    Get PRD metrics:
    - Response rate per intervention
    - Approval rate
    """
    return get_outcome_metrics()
