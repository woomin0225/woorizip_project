from __future__ import annotations

from copy import deepcopy
from threading import Lock
from typing import Any


class InMemorySessionStore:
    def __init__(self):
        self._data: dict[str, dict[str, Any]] = {}
        self._lock = Lock()

    def get(self, session_id: str) -> dict[str, Any]:
        if not session_id:
            return {}
        with self._lock:
            return deepcopy(self._data.get(session_id, {}))

    def set(self, session_id: str, value: dict[str, Any]) -> None:
        if not session_id:
            return
        with self._lock:
            self._data[session_id] = deepcopy(value)

    def delete(self, session_id: str) -> None:
        if not session_id:
            return
        with self._lock:
            self._data.pop(session_id, None)
