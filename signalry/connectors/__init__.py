"""
Connectors package — pluggable source adapters for Signalry.
"""

from .base import (
    ConnectorBase,
    ConnectorMode,
    ConnectorRegistry,
    ConnectorStatus,
    PullConnector,
    PushConnector,
)
from .discord import DiscordConnector
from .mock import MockConnector
from .realistic_mock import RealisticMockConnector
from .telegram import TelegramConnector


def get_registry() -> ConnectorRegistry:
    """Create a ConnectorRegistry with all built-in connectors registered."""
    registry = ConnectorRegistry()
    registry.register(MockConnector())
    registry.register(TelegramConnector())
    registry.register(DiscordConnector())
    registry.register(RealisticMockConnector())
    return registry
