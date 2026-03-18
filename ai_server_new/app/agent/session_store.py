from __future__ import annotations

"""방 등록 대화의 중간 상태를 잠시 보관하는 저장소.

이 파일은 데이터베이스처럼 영구 저장하는 계층이 아니라, 여러 번의 대화를 오가며
"지금까지 어떤 슬롯을 채웠는가?"를 잠깐 기억하는 역할만 맡는다.

왜 필요한가?
- 사용자가 한 번에 모든 정보를 말하지 않는 경우가 많다.
- 예를 들어 "방 등록할게" 다음에 "이름은 햇살방", "보증금은 1000"처럼 나눠 말할 수 있다.
- 그래서 각 요청 사이에 중간 상태를 저장해 두어야 다음 질문을 자연스럽게 이어갈 수 있다.
"""

from copy import deepcopy
from threading import Lock
from typing import Any


class InMemorySessionStore:
    """프로세스 메모리 안에 세션 상태를 저장하는 아주 단순한 저장소."""

    def __init__(self):
        self._data: dict[str, dict[str, Any]] = {}
        self._lock = Lock()

    def get(self, session_id: str) -> dict[str, Any]:
        """세션 상태를 읽어 온다."""

        if not session_id:
            return {}
        with self._lock:
            return deepcopy(self._data.get(session_id, {}))

    def set(self, session_id: str, value: dict[str, Any]) -> None:
        """세션 상태를 저장하거나 최신 값으로 덮어쓴다."""

        if not session_id:
            return
        with self._lock:
            self._data[session_id] = deepcopy(value)

    def delete(self, session_id: str) -> None:
        """대화가 끝난 세션 상태를 제거한다."""

        if not session_id:
            return
        with self._lock:
            self._data.pop(session_id, None)
