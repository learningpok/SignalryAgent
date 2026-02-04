import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "signals.db"

def init_feedback_table():
    """Create feedback table if it doesn't exist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signal_id TEXT NOT NULL,
            feedback_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            UNIQUE(signal_id)
        )
    """)
    conn.commit()
    conn.close()

def save_feedback(signal_id: str, feedback_type: str):
    """Save or update feedback for a signal"""
    init_feedback_table()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT OR REPLACE INTO feedback (signal_id, feedback_type, timestamp)
        VALUES (?, ?, ?)
    """, (signal_id, feedback_type, timestamp))
    
    conn.commit()
    conn.close()
    return {"signal_id": signal_id, "feedback_type": feedback_type, "timestamp": timestamp}

def get_all_feedback():
    """Get all feedback records"""
    init_feedback_table()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT signal_id, feedback_type, timestamp FROM feedback ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {"signal_id": row[0], "feedback_type": row[1], "timestamp": row[2]}
        for row in rows
    ]
