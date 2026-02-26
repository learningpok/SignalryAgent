"""
Mock connector — reads signals from local JSON file.
Adapts the existing MockIngestor logic to the connector framework.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from signalry.models import Signal

from .base import ConnectorStatus, PullConnector


class MockConnector(PullConnector):
    """Pull connector that reads from data/mock_posts.json."""

    name = "mock"

    def __init__(self, data_path: str = "data/mock_posts.json") -> None:
        self.data_path = Path(data_path)
        self.status = ConnectorStatus.CONNECTED
        self._config = {}

    def fetch(
        self,
        keywords: List[str],
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Signal]:
        if not self.data_path.exists():
            return []

        with open(self.data_path, "r") as f:
            raw = json.load(f)

        signals: List[Signal] = []
        for item in raw:
            ts = datetime.fromisoformat(
                item.get("timestamp", datetime.utcnow().isoformat())
            )
            if since and ts < since:
                continue

            text_lower = item.get("text", "").lower()
            if keywords and not any(kw.lower() in text_lower for kw in keywords):
                continue

            signals.append(Signal(
                id=item.get("id", ""),
                source=item.get("source", "x"),
                actor=item.get("actor", ""),
                text=item.get("text", ""),
                timestamp=ts,
                source_id=item.get("source_id", item.get("id", "")),
                reply_to=item.get("reply_to"),
                metrics=item.get("metrics", {}),
            ))

            if len(signals) >= limit:
                break

        return signals

    def health(self) -> dict:
        base = super().health()
        base["data_path"] = str(self.data_path)
        base["file_exists"] = self.data_path.exists()
        return base
