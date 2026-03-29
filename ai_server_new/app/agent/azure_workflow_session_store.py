from __future__ import annotations

from threading import Lock
from typing import Any


class AzureWorkflowSessionStore:
    """In-memory state store for Azure workflow continuation."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._items: dict[str, dict[str, Any]] = {}

    def get(self, session_id: str) -> dict[str, Any]:
        if not session_id:
            return {}
        with self._lock:
            return dict(self._items.get(session_id) or {})

    def set(self, session_id: str, state: dict[str, Any]) -> None:
        if not session_id:
            return
        with self._lock:
            self._items[session_id] = dict(state or {})

    def delete(self, session_id: str) -> None:
        if not session_id:
            return
        with self._lock:
            self._items.pop(session_id, None)


shared_azure_workflow_session_store = AzureWorkflowSessionStore()
