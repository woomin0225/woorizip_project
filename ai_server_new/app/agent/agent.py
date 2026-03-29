"""간단한 모듈 레벨 에이전트 진입점.

서비스 코드에서는 보통 클래스를 직접 생성해서 쓰지만, 빠르게 실험할 때는 모듈에서
바로 사용할 수 있는 단일 인스턴스가 편할 때가 있다.
"""

from app.agent.room_registration_agent import RoomRegistrationAgent


# 이 인스턴스는 "지금 바로 호출해 볼 수 있는 기본 방 등록 에이전트" 역할을 한다.
# 다만 실제 서비스에서는 세션 생명주기와 의존성 주입을 더 명확히 관리하기 위해
# `AssistantService` 안에서 직접 생성해서 쓰는 방식을 함께 사용하고 있다.
room_registration_agent = RoomRegistrationAgent()


__all__ = ["RoomRegistrationAgent", "room_registration_agent"]
