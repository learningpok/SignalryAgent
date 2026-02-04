
from fastapi import FastAPI
from store import get_top_items

app = FastAPI(title="Signalry API")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/signals")
def list_signals(limit: int = 20):
    items = get_top_items(limit)
    return [item.__dict__ for item in items]
