"""
Connector framework — pluggable source adapters.

ConnectorBase defines the interface. Two modes:
- PullConnector: fetch on demand (polling)
- PushConnector: real-time stream via callback

ConnectorRegistry manages all registered connectors.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

from signalry.models import Signal


class ConnectorMode(str, Enum):
    PULL = "pull"
    PUSH = "push"


class ConnectorStatus(str, Enum):
    IDLE = "idle"
    CONNECTED = "connected"
    ERROR = "error"
    DISABLED = "disabled"


class ConnectorBase(ABC):
    """Interface all connectors implement."""

    name: str = ""
    mode: ConnectorMode = ConnectorMode.PULL
    status: ConnectorStatus = ConnectorStatus.IDLE
    _config: Dict[str, Any] = {}

    def configure(self, config: Dict[str, Any]) -> None:
        """Apply configuration to this connector."""
        self._config = config

    def health(self) -> Dict:
        """Return health/status info for this connector."""
        return {
            "name": self.name,
            "mode": self.mode.value,
            "status": self.status.value,
        }


class PullConnector(ConnectorBase):
    """Connector that fetches signals on demand."""

    mode = ConnectorMode.PULL

    @abstractmethod
    def fetch(
        self,
        keywords: List[str],
        since: Optional[datetime] = None,
        limit: int = 100,
    ) -> List[Signal]:
        """Fetch signals matching keywords, optionally since a timestamp."""
        ...


class PushConnector(ConnectorBase):
    """Connector that streams signals in real time via callback."""

    mode = ConnectorMode.PUSH

    @abstractmethod
    def start(self, callback: Callable[[Signal], None]) -> None:
        """Start listening and call callback for each new signal."""
        ...

    @abstractmethod
    def stop(self) -> None:
        """Stop the listener."""
        ...


class ConnectorRegistry:
    """Registry of all available connectors."""

    def __init__(self) -> None:
        self._connectors: Dict[str, ConnectorBase] = {}

    def register(self, connector: ConnectorBase) -> None:
        """Register a connector by its name."""
        self._connectors[connector.name] = connector

    def get(self, name: str) -> Optional[ConnectorBase]:
        """Get a connector by name."""
        return self._connectors.get(name)

    def list_all(self) -> List[ConnectorBase]:
        """List all registered connectors."""
        return list(self._connectors.values())

    def list_healthy(self) -> List[ConnectorBase]:
        """List connectors that are not in error/disabled state."""
        return [
            c for c in self._connectors.values()
            if c.status not in (ConnectorStatus.ERROR, ConnectorStatus.DISABLED)
        ]

    def list_pull(self) -> List[PullConnector]:
        """List all pull-mode connectors."""
        return [
            c for c in self._connectors.values()
            if isinstance(c, PullConnector)
        ]

    def list_push(self) -> List[PushConnector]:
        """List all push-mode connectors."""
        return [
            c for c in self._connectors.values()
            if isinstance(c, PushConnector)
        ]
