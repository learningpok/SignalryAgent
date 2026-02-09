"""
Signal ingestion — collect candidate posts.

Design:
- IngestorBase: abstract interface any source implements
- MockIngestor: reads from JSON files (for dev/testing)
- XIngestor: real X/Twitter connector (requires API keys)

v1 scope: MockIngestor ships working. XIngestor is designed but
requires API credentials to activate.
"""

from __future__ import annotations

import json
import os
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import List, Optional

from .models import Signal


class IngestorBase(ABC):
    """Interface all ingestors implement."""

    @abstractmethod
    def fetch(self, keywords: List[str], since: Optional[datetime] = None) -> List[Signal]:
        """Fetch raw signals matching keywords, optionally since a timestamp."""
        ...


class MockIngestor(IngestorBase):
    """Reads signals from a local JSON file. For dev and testing."""

    def __init__(self, data_path: str = "data/mock_posts.json"):
        self.data_path = Path(data_path)

    def fetch(self, keywords: List[str], since: Optional[datetime] = None) -> List[Signal]:
        if not self.data_path.exists():
            return []

        with open(self.data_path, "r") as f:
            raw = json.load(f)

        signals = []
        for item in raw:
            ts = datetime.fromisoformat(item.get("timestamp", datetime.utcnow().isoformat()))
            if since and ts < since:
                continue

            text_lower = item.get("text", "").lower()
            # If keywords provided, filter to posts containing at least one
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

        return signals


class XIngestor(IngestorBase):
    """
    Real X/Twitter connector.

    Requires environment variables:
        X_BEARER_TOKEN — Twitter API v2 bearer token

    Uses the recent search endpoint:
        GET /2/tweets/search/recent

    Rate limits: 450 requests per 15-min window (app-level).
    Each request returns up to 100 tweets.
    """

    SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"

    def __init__(self):
        self.bearer_token = os.environ.get("X_BEARER_TOKEN", "")
        if not self.bearer_token:
            raise EnvironmentError(
                "X_BEARER_TOKEN not set. "
                "Get one at https://developer.twitter.com/en/portal/projects-and-apps"
            )

    def fetch(self, keywords: List[str], since: Optional[datetime] = None) -> List[Signal]:
        """
        Fetch recent tweets matching keywords.

        NOTE: This requires the `requests` package and a valid bearer token.
        For v1, we design the interface and test with MockIngestor.
        Real activation is a config change, not a code change.
        """
        try:
            import requests
        except ImportError:
            raise ImportError("pip install requests — required for live X ingestion")

        query = " OR ".join(keywords) + " -is:retweet lang:en"

        params = {
            "query": query,
            "max_results": 100,
            "tweet.fields": "created_at,author_id,public_metrics,conversation_id,in_reply_to_user_id",
        }
        if since:
            params["start_time"] = since.strftime("%Y-%m-%dT%H:%M:%SZ")

        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        resp = requests.get(self.SEARCH_URL, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()

        signals = []
        for tweet in data.get("data", []):
            metrics = tweet.get("public_metrics", {})
            signals.append(Signal(
                source="x",
                actor=tweet.get("author_id", ""),
                text=tweet.get("text", ""),
                timestamp=datetime.fromisoformat(
                    tweet["created_at"].replace("Z", "+00:00")
                ),
                source_id=tweet["id"],
                reply_to=tweet.get("conversation_id") if tweet.get("in_reply_to_user_id") else None,
                metrics={
                    "likes": metrics.get("like_count", 0),
                    "retweets": metrics.get("retweet_count", 0),
                    "replies": metrics.get("reply_count", 0),
                    "quotes": metrics.get("quote_count", 0),
                },
            ))

        return signals


def get_ingestor(live: bool = False) -> IngestorBase:
    """Factory: returns MockIngestor by default, XIngestor if live=True."""
    if live:
        return XIngestor()
    return MockIngestor()
