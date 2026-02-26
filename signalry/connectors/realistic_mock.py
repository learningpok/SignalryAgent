"""
Realistic mock connector — generates believable multi-source signals for demos.

Reads from data/realistic_signals.json and produces Signal objects
with dynamic timestamps relative to now. Signals come from 3 simulated
sources (Intercom, Slack, Hubspot) and include momentum clusters and
cross-channel correlations.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from signalry.models import Signal

from .base import ConnectorStatus, PullConnector


class RealisticMockConnector(PullConnector):
    """Pull connector that generates realistic multi-source demo signals."""

    name = "realistic_mock"

    def __init__(self, data_path: str = "data/realistic_signals.json") -> None:
        self.data_path = Path(data_path)
        self.status = ConnectorStatus.CONNECTED
        self._config = {}

    def _load_pool(self) -> list:
        """Load the message template pool from JSON."""
        if not self.data_path.exists():
            return []
        with open(self.data_path) as f:
            return json.load(f)

    def fetch(
        self,
        keywords: List[str],
        since: Optional[datetime] = None,
        limit: int = 100,
        persona: Optional[str] = None,
    ) -> List[Signal]:
        """Generate signals from the template pool with dynamic timestamps."""
        pool = self._load_pool()
        now = datetime.utcnow()

        signals: List[Signal] = []
        for i, item in enumerate(pool):
            # Persona filter
            if persona:
                item_personas = item.get("personas", [])
                if persona not in item_personas:
                    continue

            hours_ago = item.get("hours_ago", 0)
            ts = now - timedelta(hours=hours_ago)

            if since and ts <= since:
                continue

            text = item.get("text", "")
            if keywords and not any(kw.lower() in text.lower() for kw in keywords):
                continue

            signals.append(Signal(
                id=f"rm_{i + 1:03d}",
                source=item.get("source", "mock"),
                actor=item.get("actor", ""),
                text=text,
                timestamp=ts,
                source_id=f"rm_src_{i + 1:03d}",
                metrics=item.get("metrics", {}),
            ))

            if len(signals) >= limit:
                break

        return signals

    def health(self) -> dict:
        base = super().health()
        base["data_path"] = str(self.data_path)
        base["file_exists"] = self.data_path.exists()
        base["pool_size"] = len(self._load_pool())
        return base
