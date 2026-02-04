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
