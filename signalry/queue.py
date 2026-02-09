"""
Review queue — SQLite-backed store for human review.

PRD: "Queue of classified signals / Approve / discard actions / Manual override"

Design:
- SQLite for persistence (no external DB needed)
- Simple CRUD: add, list, approve, discard
- Dedup by source_id (no duplicate interventions per actor)
- Outcome logging built in
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from .models import (
    Classification, IntentStage, Outcome, ResponseType, ReviewItem,
    Signal, Urgency,
)

DEFAULT_DB_PATH = "data/signalry.db"


class ReviewQueue:
    """SQLite-backed review queue with outcome logging."""

    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS signals (
                    id TEXT PRIMARY KEY,
                    source TEXT,
                    actor TEXT,
                    text TEXT,
                    timestamp TEXT,
                    source_id TEXT UNIQUE,
                    reply_to TEXT,
                    metrics TEXT
                );

                CREATE TABLE IF NOT EXISTS classifications (
                    signal_id TEXT PRIMARY KEY REFERENCES signals(id),
                    intent_stage TEXT,
                    primary_pain TEXT,
                    urgency TEXT,
                    confidence REAL,
                    momentum_flag INTEGER,
                    recommended_action TEXT
                );

                CREATE TABLE IF NOT EXISTS review_queue (
                    signal_id TEXT PRIMARY KEY REFERENCES signals(id),
                    status TEXT DEFAULT 'pending',
                    reviewed_at TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS outcomes (
                    signal_id TEXT PRIMARY KEY REFERENCES signals(id),
                    responded INTEGER,
                    response_type TEXT,
                    notes TEXT,
                    logged_at TEXT
                );

                CREATE INDEX IF NOT EXISTS idx_review_status
                    ON review_queue(status);
                CREATE INDEX IF NOT EXISTS idx_signals_actor
                    ON signals(actor);
                CREATE INDEX IF NOT EXISTS idx_classifications_pain
                    ON classifications(primary_pain);
            """)

    # ── Add signals + classifications ───────────────────────────────────

    def add(self, signal: Signal, classification: Classification) -> bool:
        """
        Add a signal and its classification to the review queue.
        Returns False if duplicate (same source_id already exists).
        PRD: "No duplicate interventions per actor" — enforced via UNIQUE on source_id.
        """
        try:
            with self._conn() as conn:
                conn.execute(
                    """INSERT OR IGNORE INTO signals
                       (id, source, actor, text, timestamp, source_id, reply_to, metrics)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (signal.id, signal.source, signal.actor, signal.text,
                     signal.timestamp.isoformat(), signal.source_id,
                     signal.reply_to, json.dumps(signal.metrics)),
                )
                conn.execute(
                    """INSERT OR IGNORE INTO classifications
                       (signal_id, intent_stage, primary_pain, urgency,
                        confidence, momentum_flag, recommended_action)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (classification.signal_id, classification.intent_stage.value,
                     classification.primary_pain, classification.urgency.value,
                     classification.confidence, int(classification.momentum_flag),
                     classification.recommended_action),
                )
                conn.execute(
                    """INSERT OR IGNORE INTO review_queue (signal_id, status)
                       VALUES (?, 'pending')""",
                    (signal.id,),
                )
            return True
        except sqlite3.IntegrityError:
            return False

    # ── Query ───────────────────────────────────────────────────────────

    def list_pending(self, limit: int = 50) -> List[ReviewItem]:
        """List signals pending human review, ordered by urgency + confidence."""
        return self._list_by_status("pending", limit)

    def list_approved(self, limit: int = 50) -> List[ReviewItem]:
        """List approved signals."""
        return self._list_by_status("approved", limit)

    def list_all(self, limit: int = 100) -> List[ReviewItem]:
        """List all review items regardless of status."""
        return self._query_items("1=1", limit)

    def _list_by_status(self, status: str, limit: int) -> List[ReviewItem]:
        return self._query_items("rq.status = ?", limit, (status,))

    def _query_items(self, where: str, limit: int, params: tuple = ()) -> List[ReviewItem]:
        urgency_order = "CASE c.urgency WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END"
        query = f"""
            SELECT s.*, c.intent_stage, c.primary_pain, c.urgency, c.confidence,
                   c.momentum_flag, c.recommended_action,
                   rq.status, rq.reviewed_at
            FROM review_queue rq
            JOIN signals s ON rq.signal_id = s.id
            JOIN classifications c ON c.signal_id = s.id
            WHERE {where}
            ORDER BY c.momentum_flag DESC, {urgency_order}, c.confidence DESC
            LIMIT ?
        """
        with self._conn() as conn:
            rows = conn.execute(query, (*params, limit)).fetchall()

        return [self._row_to_review_item(row) for row in rows]

    def _row_to_review_item(self, row: sqlite3.Row) -> ReviewItem:
        return ReviewItem(
            signal=Signal(
                id=row["id"],
                source=row["source"],
                actor=row["actor"],
                text=row["text"],
                timestamp=datetime.fromisoformat(row["timestamp"]),
                source_id=row["source_id"],
                reply_to=row["reply_to"],
                metrics=json.loads(row["metrics"]) if row["metrics"] else {},
            ),
            classification=Classification(
                signal_id=row["id"],
                intent_stage=IntentStage(row["intent_stage"]),
                primary_pain=row["primary_pain"],
                urgency=Urgency(row["urgency"]),
                confidence=row["confidence"],
                momentum_flag=bool(row["momentum_flag"]),
                recommended_action=row["recommended_action"],
            ),
            status=row["status"],
            reviewed_at=datetime.fromisoformat(row["reviewed_at"]) if row["reviewed_at"] else None,
        )

    # ── Actions ─────────────────────────────────────────────────────────

    def approve(self, signal_id: str) -> bool:
        """Approve a signal for action."""
        return self._update_status(signal_id, "approved")

    def discard(self, signal_id: str) -> bool:
        """Discard a signal (not worth acting on)."""
        return self._update_status(signal_id, "discarded")

    def _update_status(self, signal_id: str, status: str) -> bool:
        with self._conn() as conn:
            cur = conn.execute(
                "UPDATE review_queue SET status = ?, reviewed_at = ? WHERE signal_id = ?",
                (status, datetime.utcnow().isoformat(), signal_id),
            )
            return cur.rowcount > 0

    # ── Outcome logging ─────────────────────────────────────────────────

    def log_outcome(self, outcome: Outcome) -> bool:
        """
        Log the outcome of an approved action.
        PRD: "100% of approved actions have recorded outcomes"
        """
        with self._conn() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO outcomes
                   (signal_id, responded, response_type, notes, logged_at)
                   VALUES (?, ?, ?, ?, ?)""",
                (outcome.signal_id, int(outcome.responded),
                 outcome.response_type.value, outcome.notes,
                 outcome.logged_at.isoformat()),
            )
        return True

    def get_outcome(self, signal_id: str) -> Optional[Outcome]:
        """Retrieve outcome for a signal."""
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM outcomes WHERE signal_id = ?",
                (signal_id,),
            ).fetchone()
        if not row:
            return None
        return Outcome(
            signal_id=row["signal_id"],
            responded=bool(row["responded"]),
            response_type=ResponseType(row["response_type"]),
            notes=row["notes"],
            logged_at=datetime.fromisoformat(row["logged_at"]),
        )

    # ── Stats ───────────────────────────────────────────────────────────

    def stats(self) -> Dict:
        """Quick stats for the review queue."""
        with self._conn() as conn:
            total = conn.execute("SELECT COUNT(*) FROM review_queue").fetchone()[0]
            pending = conn.execute("SELECT COUNT(*) FROM review_queue WHERE status='pending'").fetchone()[0]
            approved = conn.execute("SELECT COUNT(*) FROM review_queue WHERE status='approved'").fetchone()[0]
            discarded = conn.execute("SELECT COUNT(*) FROM review_queue WHERE status='discarded'").fetchone()[0]
            outcomes = conn.execute("SELECT COUNT(*) FROM outcomes").fetchone()[0]
            momentum = conn.execute("SELECT COUNT(*) FROM classifications WHERE momentum_flag=1").fetchone()[0]
        return {
            "total": total,
            "pending": pending,
            "approved": approved,
            "discarded": discarded,
            "outcomes_logged": outcomes,
            "momentum_flags": momentum,
        }
