"""
Outcome logging storage (PRD requirement)

From PRD User Flow:
7. Outcome is logged
   - responded: boolean
   - response_type: {reply | follow_up | none}
   - notes
"""

import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "signals.db"


def init_outcome_table():
    """Create outcome logging table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS outcomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id TEXT NOT NULL UNIQUE,
            acted BOOLEAN NOT NULL,
            response_type TEXT,
            notes TEXT,
            timestamp TEXT NOT NULL
        )
    """)
    
    conn.commit()
    conn.close()


def save_outcome(signal_id: str, acted: bool, response_type: str = None, notes: str = ""):
    """
    Save outcome for a signal (PRD requirement)
    
    Args:
        signal_id: Signal ID
        acted: Did the user take action?
        response_type: reply | follow_up | none
        notes: Qualitative notes about outcome
    """
    init_outcome_table()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    
    # Insert or replace (UPSERT)
    cursor.execute("""
        INSERT OR REPLACE INTO outcomes 
        (signal_id, acted, response_type, notes, timestamp)
        VALUES (?, ?, ?, ?, ?)
    """, (signal_id, acted, response_type, notes, timestamp))
    
    conn.commit()
    conn.close()


def get_all_outcomes():
    """Retrieve all logged outcomes"""
    init_outcome_table()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT signal_id, acted, response_type, notes, timestamp
        FROM outcomes
        ORDER BY timestamp DESC
    """)
    
    results = cursor.fetchall()
    conn.close()
    
    return [
        {
            "signal_id": row[0],
            "acted": bool(row[1]),
            "response_type": row[2],
            "notes": row[3],
            "timestamp": row[4]
        }
        for row in results
    ]


def get_outcome_metrics():
    """
    Calculate PRD metrics:
    - Response rate per intervention
    - Approval rate
    """
    init_outcome_table()
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total outcomes logged
    cursor.execute("SELECT COUNT(*) FROM outcomes")
    total = cursor.fetchone()[0]
    
    # How many resulted in action
    cursor.execute("SELECT COUNT(*) FROM outcomes WHERE acted = 1")
    acted_count = cursor.fetchone()[0]
    
    conn.close()
    
    if total == 0:
        return {
            "total_outcomes": 0,
            "action_rate": 0.0,
            "message": "No outcomes logged yet"
        }
    
    return {
        "total_outcomes": total,
        "acted": acted_count,
        "skipped": total - acted_count,
        "action_rate": round(acted_count / total * 100, 1)
    }
