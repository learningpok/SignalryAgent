import json
from pathlib import Path

from models import RawPost

DATA_FILE = Path(__file__).parent / "data" / "raw_posts.json"


def ingest() -> list[RawPost]:
    """Read raw posts from local JSON file."""
    if not DATA_FILE.exists():
        return []

    with open(DATA_FILE) as f:
        data = json.load(f)

    return [
        RawPost(
            id=p["id"],
            text=p["text"],
            author=p["author"],
            timestamp=p["timestamp"],
            likes=p.get("likes", 0),
            reposts=p.get("reposts", 0),
        )
        for p in data
    ]
