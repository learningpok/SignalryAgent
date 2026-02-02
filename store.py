import json
import sqlite3
from pathlib import Path
from datetime import datetime

from models import SignalItem

DB_PATH = Path(__file__).parent / "data" / "signals.db"


def init_db():
    """Create tables if they don't exist."""
    DB_PATH.parent.mkdir(exist_ok=True)

    if DB_PATH.exists():
        DB_PATH.unlink()

    conn = _connect()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS signal_items (
            id TEXT PRIMARY KEY,
            source_id TEXT,
            text TEXT,
            author TEXT,
            timestamp TEXT,
            format TEXT,
            signal_type TEXT,
            priority_score REAL,
            severity_score REAL,
            recurrence_score REAL,
            business_weight REAL,
            account_tier TEXT,
            reasons TEXT
        )
    """)
    conn.commit()
    conn.close()


def store(items: list[SignalItem]):
    """Upsert signal items into database."""
    conn = _connect()
    for item in items:
        conn.execute(
            """
            INSERT OR REPLACE INTO signal_items
            (id, source_id, text, author, timestamp, format, signal_type,
             priority_score, severity_score, recurrence_score, business_weight,
             account_tier, reasons)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item.id,
                item.source_id,
                item.text,
                item.author,
                item.timestamp.isoformat(),
                item.format,
                item.signal_type,
                item.priority_score,
                item.severity_score,
                item.recurrence_score,
                item.business_weight,
                item.account_tier,
                json.dumps(item.reasons),
            ),
        )
    conn.commit()
    conn.close()


def get_top_items(n: int = 10) -> list[SignalItem]:
    """Retrieve top N items by priority score."""
    conn = _connect()
    rows = conn.execute(
        """
        SELECT id, source_id, text, author, timestamp, format, signal_type,
               priority_score, severity_score, recurrence_score, business_weight,
               account_tier, reasons
        FROM signal_items
        ORDER BY priority_score DESC
        LIMIT ?
        """,
        (n,),
    ).fetchall()
    conn.close()

    return [
        SignalItem(
            id=r[0],
            source_id=r[1],
            text=r[2],
            author=r[3],
            timestamp=datetime.fromisoformat(r[4]),
            format=r[5],
            signal_type=r[6],
            priority_score=r[7],
            severity_score=r[8],
            recurrence_score=r[9],
            business_weight=r[10],
            account_tier=r[11],
            reasons=json.loads(r[12]),
        )
        for r in rows
    ]


def _connect() -> sqlite3.Connection:
    return sqlite3.connect(DB_PATH)
