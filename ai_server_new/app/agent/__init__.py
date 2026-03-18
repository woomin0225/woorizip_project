"""에이전트 패키지 진입점.

초심자 입장에서는 `app.agent`를 "방 등록 전용 에이전트 기능을 꺼내 쓰는 입구"라고
생각하면 이해하기 쉽다. 지금은 `RoomRegistrationAgent` 하나만 외부에 공개하지만,
나중에 투어 신청 에이전트, 예약 에이전트 같은 전용 에이전트를 더 추가할 수도 있다.
"""

from app.agent.room_registration_agent import RoomRegistrationAgent

__all__ = ["RoomRegistrationAgent"]
