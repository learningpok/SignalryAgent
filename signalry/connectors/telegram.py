"""
Telegram connector — push-mode stub.

Designed for Telegram Bot API integration.
Requires bot_token in config. Start/stop are stubs for now.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict

from signalry.models import Signal

from .base import ConnectorStatus, PushConnector

logger = logging.getLogger(__name__)


class TelegramConnector(PushConnector):
    """Push connector for Telegram groups/channels."""

    name = "telegram"

    def __init__(self) -> None:
        self.status = ConnectorStatus.IDLE
        self._config: Dict[str, Any] = {}
        self._callback: Callable[[Signal], None] | None = None

    def configure(self, config: Dict[str, Any]) -> None:
        self._config = config
        if not config.get("bot_token"):
            self.status = ConnectorStatus.ERROR
            logger.error("Telegram connector requires bot_token in config")
        else:
            self.status = ConnectorStatus.IDLE
            logger.info("Telegram connector configured")

    def start(self, callback: Callable[[Signal], None]) -> None:
        if not self._config.get("bot_token"):
            logger.error("Cannot start Telegram connector: no bot_token configured")
            self.status = ConnectorStatus.ERROR
            return
        self._callback = callback
        self.status = ConnectorStatus.CONNECTED
        logger.info("Telegram connector started (stub)")

    def stop(self) -> None:
        self._callback = None
        self.status = ConnectorStatus.IDLE
        logger.info("Telegram connector stopped (stub)")

    @staticmethod
    def _parse_message(msg: dict) -> Signal:
        """Parse a Telegram message dict into a Signal."""
        return Signal(
            source="telegram",
            actor=msg.get("from", {}).get("username", "unknown"),
            text=msg.get("text", ""),
            source_id=str(msg.get("message_id", "")),
        )

    def health(self) -> dict:
        base = super().health()
        base["configured"] = bool(self._config.get("bot_token"))
        return base
