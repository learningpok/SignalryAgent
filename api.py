from fastapi import FastAPI
from store import get_top_items

app = FastAPI(title="Signalry API")

@app.get("/signals")
def list_signals(limit: int = 20):
    items = get_top_items(limit)
    return [item.__dict__ for item in items]
