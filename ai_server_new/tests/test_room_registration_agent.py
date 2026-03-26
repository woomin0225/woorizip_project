from __future__ import annotations

import asyncio

from app.agent.room_registration_agent import RoomRegistrationAgent


class DummyRoomService:
    async def create_for_chatbot(self, **kwargs):  # pragma: no cover
        raise AssertionError("create_for_chatbot should not be called in slot collection tests")


def test_room_create_first_turn_asks_house_name_when_multiple_houses_exist():
    agent = RoomRegistrationAgent(service=DummyRoomService())
    payload = {
        "sessionId": "room-create-multi-house",
        "text": "방 등록해줘",
        "context": {
            "userProfile": {"isLessor": True},
            "currentHouse": {"houseNo": "H001", "houseName": "강동메트로07"},
            "availableHouses": [
                {"houseNo": "H001", "houseName": "강동메트로07"},
                {"houseNo": "H002", "houseName": "강서네스트03"},
                {"houseNo": "H003", "houseName": "관악메이트09"},
                {"houseNo": "H004", "houseName": "너네집빌라"},
                {"houseNo": "H005", "houseName": "노원그린08"},
                {"houseNo": "H006", "houseName": "마포스테이11"},
            ],
        },
    }

    result = asyncio.run(agent.run(payload))

    assert result["reply"] == (
        "어느 건물에 방을 등록할까요? 건물명을 알려주세요.\n"
        "선택 가능한 건물: 강동메트로07, 강서네스트03, 관악메이트09, 너네집빌라, 노원그린08 외"
    )
    assert result["result"]["missingSlots"][0] == "houseNo"
    assert agent.store.get("room-create-multi-house")["slots"].get("houseNo") is None


def test_room_create_follow_up_resolves_house_name_and_moves_to_room_name():
    agent = RoomRegistrationAgent(service=DummyRoomService())
    initial_payload = {
        "sessionId": "room-create-follow-up",
        "text": "방 등록해줘",
        "context": {
            "userProfile": {"isLessor": True},
            "currentHouse": {"houseNo": "H001", "houseName": "강동메트로07"},
            "availableHouses": [
                {"houseNo": "H001", "houseName": "강동메트로07"},
                {"houseNo": "H002", "houseName": "강서네스트03"},
            ],
        },
    }
    asyncio.run(agent.run(initial_payload))

    follow_up_payload = {
        "sessionId": "room-create-follow-up",
        "text": "강서네스트03",
        "context": initial_payload["context"],
    }

    result = asyncio.run(agent.run(follow_up_payload))

    assert result["reply"] == "등록할 방 이름을 알려주세요."
    session_state = agent.store.get("room-create-follow-up")
    assert session_state["slots"]["houseNo"] == "H002"
    assert session_state["slots"]["houseName"] == "강서네스트03"


def test_room_create_still_autofills_when_only_one_house_is_available():
    agent = RoomRegistrationAgent(service=DummyRoomService())
    payload = {
        "sessionId": "room-create-single-house",
        "text": "방 등록해줘",
        "context": {
            "userProfile": {"isLessor": True},
            "currentHouse": {"houseNo": "H001", "houseName": "강동메트로07"},
            "availableHouses": [
                {"houseNo": "H001", "houseName": "강동메트로07"},
            ],
        },
    }

    result = asyncio.run(agent.run(payload))

    assert result["reply"] == "등록할 방 이름을 알려주세요."
    session_state = agent.store.get("room-create-single-house")
    assert session_state["slots"]["houseNo"] == "H001"
    assert session_state["slots"]["houseName"] == "강동메트로07"
