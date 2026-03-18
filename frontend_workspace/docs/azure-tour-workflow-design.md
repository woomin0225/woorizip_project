# Azure Tour Workflow Design

## Recommended Type
`인간개입`

이유:
- 투어 신청은 한 번에 끝나는 자유 질의응답보다, 필요한 정보를 순서대로 수집하는 흐름이 더 중요합니다.
- 현재 프로젝트 코드상 필수값이 명확합니다.
- 민감한 실제 신청 작업 전 최종 재확인이 필요합니다.

현재 프론트 기준 필수값:
- `roomNo`
- `visitDate`
- `visitTime`
- `name`
- `phone`

선택값:
- `inquiry`

실제 신청 API:
- `POST /api/tour/insert/{roomNo}`

실제 payload:
```json
{
  "visitDate": "2026-03-20",
  "visitTime": "15:00:00",
  "message": "문의사항 또는 기본 신청자 정보"
}
```

관련 코드 근거:
- [TourApply.jsx](/c:/woorizip_project/frontend_workspace/src/features/tour/pages/TourApply.jsx)
- [tourAPI.js](/c:/woorizip_project/frontend_workspace/src/features/tour/api/tourAPI.js)
- [TourApplyButton.jsx](/c:/woorizip_project/frontend_workspace/src/features/houseAndRoom/components/Detail/TourApplyButton.jsx)

## Workflow Goal
사용자가 자연어로 투어를 신청하려고 할 때,
현재 보고 있는 방 또는 선택한 방을 기준으로
날짜, 시간, 이름, 전화번호, 문의사항을 수집하고
최종 확인 후 신청 API를 호출합니다.

## Required Inputs
### Preferred
- `roomNo`
  - 현재 매물 상세 페이지라면 프론트 컨텍스트에서 전달

### If missing
- 방 이름 또는 매물 식별 정보

### User-provided
- `visitDate`
- `visitTime`
- `name`
- `phone`
- `inquiry` optional

## Validation Rules
- `roomNo`가 없으면 신청 대상 매물을 먼저 확정해야 함
- `visitDate`는 오늘 이후 날짜여야 함
- `visitTime`은 아래 시간대 중 하나여야 함
  - `14:00`
  - `15:00`
  - `16:00`
  - `17:00`
  - `18:00`
  - `19:00`
- `name`, `phone`은 비어 있으면 안 됨
- 실제 제출 전 예약 불가 시간인지 한 번 더 확인

## Suggested Node Flow
1. `intent_check`
- 사용자가 정말 투어 신청 의도인지 확인
- 예: "투어 신청", "방 보러 가고 싶어요", "투어 예약할래요"

2. `resolve_room`
- 현재 페이지에 `roomNo`가 있으면 바로 사용
- 없으면 매물명 또는 방 추천/빈방 보기로 유도

3. `ask_date`
- 희망 날짜 수집

4. `check_reserved_times`
- 선택 날짜 기준 이미 예약된 시간 조회
- 후보 API:
  - `GET /api/tour/reserved-times?roomNo={roomNo}&visitDate={visitDate}`
  - 코드상 fallback 후보도 존재함

5. `ask_time`
- 가능한 시간대 중 하나를 선택받음

6. `resolve_profile`
- 로그인 사용자면 내 정보에서 이름/전화번호를 먼저 채움
- 없으면 직접 입력받음

7. `ask_inquiry_optional`
- 문의사항은 선택 입력

8. `confirm_submission`
- 신청 내용을 요약해서 재확인

9. `submit_tour`
- `POST /api/tour/insert/{roomNo}`

10. `result_message`
- 성공/실패 안내
- 이후 추천 행동 제안

## Conversation Simulation
### Start
사용자: 투어 신청하고 싶어요

우리봇:
안녕하세요. 우리봇입니다.
투어 신청을 도와드리겠습니다.
지금 보고 계신 방으로 신청하시겠어요?

### Room resolved
사용자: 네

우리봇:
안녕하세요. 우리봇입니다.
희망하시는 투어 날짜를 알려주세요.
예: 3월 20일

### Date collected
사용자: 3월 20일

우리봇:
안녕하세요. 우리봇입니다.
선택 가능한 시간을 확인했습니다.
14시, 15시, 17시 중 원하시는 시간을 말씀해 주세요.

### Time collected
사용자: 15시

우리봇:
안녕하세요. 우리봇입니다.
신청자 이름과 전화번호를 확인하겠습니다.
회원 정보에 저장된 값으로 진행할까요?

### Confirmation
사용자: 네

우리봇:
안녕하세요. 우리봇입니다.
투어 신청 내용을 확인해 주세요.
3월 20일 15시에 신청하시겠습니까?

### Submit
사용자: 네, 진행해줘

우리봇:
안녕하세요. 우리봇입니다.
투어 신청이 완료되었습니다.
투어 내역은 마이페이지 또는 투어 내역 화면에서 확인하실 수 있습니다.

## Practical Workflow State Design
```yaml
kind: workflow
name: tour-apply-human-loop
description: Collect required tour application fields and submit a real tour request.
trigger:
  kind: OnRecognizedIntent
  id: trigger_tour_apply
  intentName: tour_apply
  actions:
    - kind: SetVariable
      id: set_room_no
      variable: Workflow.RoomNo
      value: "=System.Context.roomNo"

    - kind: SetVariable
      id: set_room_name
      variable: Workflow.RoomName
      value: "=System.Context.roomName"

    - kind: SetVariable
      id: set_user_name
      variable: Workflow.UserName
      value: "=System.Context.userName"

    - kind: SetVariable
      id: set_user_phone
      variable: Workflow.UserPhone
      value: "=System.Context.userPhone"

    - kind: ConditionGroup
      id: check_room_context
      conditions:
        - id: has_room_no
          condition: "=!IsBlank(Workflow.RoomNo)"
          actions:
            - kind: SendActivity
              id: send_room_detected
              activity: >-
                =Concatenate("안녕하세요. 우리봇입니다.", "\n", "현재 보고 계신 매물 ",
                Workflow.RoomName, " 기준으로 투어 신청을 도와드리겠습니다.", "\n",
                "희망하시는 방문 날짜를 알려주세요.")
            - kind: GotoAction
              id: goto_question_date
              actionId: question_visit_date
      elseActions:
        - kind: Question
          id: question_room_name
          variable: Workflow.RoomName
          prompt: |
            안녕하세요. 우리봇입니다.
            어떤 매물의 투어를 신청하실지 알려주세요.
          entity: StringPrebuiltEntity
          alwaysPrompt: true
        - kind: SendActivity
          id: send_room_manual_followup
          activity: |
            확인했습니다.
            현재는 매물 번호가 필요하므로, 실제 연결 시 roomNo를 함께 전달해 주세요.

    - kind: Question
      id: question_visit_date
      variable: Workflow.VisitDate
      prompt: |
        안녕하세요. 우리봇입니다.
        희망하시는 투어 날짜를 입력해 주세요.
        예: 2026-03-20
      entity: StringPrebuiltEntity
      alwaysPrompt: true

    - kind: SendActivity
      id: send_time_slot_guide
      activity: |
        방문 시간은 14:00, 15:00, 16:00, 17:00, 18:00, 19:00 중에서 선택하실 수 있습니다.
        원하는 시간을 입력해 주세요.

    - kind: Question
      id: question_visit_time
      variable: Workflow.VisitTime
      prompt: |
        안녕하세요. 우리봇입니다.
        희망하시는 방문 시간을 입력해 주세요.
      entity: StringPrebuiltEntity
      alwaysPrompt: true

    - kind: ConditionGroup
      id: validate_time_slot
      conditions:
        - id: allowed_time_slot
          condition: >-
            =Or(Workflow.VisitTime = "14:00", Workflow.VisitTime = "15:00",
            Workflow.VisitTime = "16:00", Workflow.VisitTime = "17:00",
            Workflow.VisitTime = "18:00", Workflow.VisitTime = "19:00")
          actions: []
      elseActions:
        - kind: SendActivity
          id: send_invalid_time_slot
          activity: |
            선택 가능한 시간은 14:00, 15:00, 16:00, 17:00, 18:00, 19:00입니다.
            다시 입력해 주세요.
        - kind: GotoAction
          id: goto_question_visit_time_again
          actionId: question_visit_time

    - kind: ConditionGroup
      id: check_saved_profile
      conditions:
        - id: has_profile
          condition: "=And(!IsBlank(Workflow.UserName), !IsBlank(Workflow.UserPhone))"
          actions:
            - kind: SendActivity
              id: send_saved_profile
              activity: >-
                =Concatenate("저장된 신청자 정보를 확인했습니다.", "\n", "이름: ",
                Workflow.UserName, "\n", "연락처: ", Workflow.UserPhone)
      elseActions:
        - kind: Question
          id: question_name
          variable: Workflow.UserName
          prompt: |
            안녕하세요. 우리봇입니다.
            신청자 이름을 입력해 주세요.
          entity: StringPrebuiltEntity
          alwaysPrompt: true
        - kind: Question
          id: question_phone
          variable: Workflow.UserPhone
          prompt: |
            안녕하세요. 우리봇입니다.
            연락 가능한 전화번호를 입력해 주세요.
          entity: StringPrebuiltEntity
          alwaysPrompt: true

    - kind: Question
      id: question_inquiry
      variable: Workflow.Inquiry
      prompt: |
        추가 문의사항이 있으면 입력해 주세요.
        없으면 "없음"이라고 입력하셔도 됩니다.
      entity: StringPrebuiltEntity
      alwaysPrompt: false

    - kind: SendActivity
      id: send_final_summary
      activity: >-
        =Concatenate("안녕하세요. 우리봇입니다.", "\n", "투어 신청 내용을 확인해 주세요.",
        "\n", "매물: ", Workflow.RoomName, "\n", "날짜: ", Workflow.VisitDate, "\n",
        "시간: ", Workflow.VisitTime, "\n", "이름: ", Workflow.UserName, "\n",
        "연락처: ", Workflow.UserPhone, "\n", "이대로 신청하시겠습니까?")

    - kind: Question
      id: question_confirm_submit
      variable: Workflow.ConfirmSubmit
      prompt: |
        신청을 진행하려면 "네", 취소하려면 "아니오"라고 입력해 주세요.
      entity: StringPrebuiltEntity
      alwaysPrompt: true

    - kind: ConditionGroup
      id: check_submit_confirmation
      conditions:
        - id: confirm_yes
          condition: >-
            =Or(Workflow.ConfirmSubmit = "네", Workflow.ConfirmSubmit = "예",
            Workflow.ConfirmSubmit = "진행", Workflow.ConfirmSubmit = "신청")
          actions:
            - kind: SendActivity
              id: send_submit_payload
              activity: >-
                =Concatenate("실제 제출 payload 예시", "\n", "POST /api/tour/insert/",
                Workflow.RoomNo, "\n", "{", "\n", "  \"visitDate\": \"",
                Workflow.VisitDate, "\",", "\n", "  \"visitTime\": \"",
                Workflow.VisitTime, ":00\",", "\n", "  \"message\": \"",
                Workflow.Inquiry, "\"", "\n", "}")
            - kind: SendActivity
              id: send_submit_success
              activity: |
                안녕하세요. 우리봇입니다.
                투어 신청이 완료되었다고 안내해 주세요.
                이후 투어 내역 확인 또는 방 상세 페이지로 이동을 제안하면 좋습니다.
      elseActions:
        - kind: SendActivity
          id: send_submit_cancelled
          activity: |
            안녕하세요. 우리봇입니다.
            투어 신청을 취소했습니다.
            원하시면 다른 날짜로 다시 신청하실 수 있습니다.
```

## Recommended Output Style For This Workflow
- 한 번에 한 가지 질문만 하기
- 날짜와 시간을 분리해서 받기
- 최종 제출 전 반드시 재확인하기
- 성공 후 다음 행동을 제안하기

예:
- `투어 내역 보기`
- `방 추천`
- `문의`

## Suggested Follow-up Chips
- `투어`
- `방 추천`
- `문의`
- `예약`

## Integration Notes
- 현재 프론트에서 투어 신청 페이지는 `'/rooms/{roomNo}/tour'` 링크로 진입합니다.
- 로그인 사용자 이름/전화번호는 내 정보 조회 결과로 자동 입력될 수 있습니다.
- 예약 가능한 시간은 서버에서 조회한 결과와 충돌하지 않도록 제출 직전 한 번 더 검증하는 것이 좋습니다.
- 실제 워크플로우 실행 주체는 Azure Agent이지만, 최종 신청 API는 Spring 백엔드를 통해 호출하는 구조가 안전합니다.

## Recommended Runtime Bridge
- Azure 워크플로우가 직접 로컬 Spring `localhost:8080`을 호출하지 말고, `ai_server_new`를 중간 브리지로 호출합니다.
- 브리지 endpoint:
  - `POST /ai/tour/apply`
- 내부 호출 흐름:
  - Azure Workflow -> `ai_server_new /ai/tour/apply`
  - `ai_server_new` -> Spring `POST /api/tour/insert/{roomNo}`

### Bridge Request Example
```json
{
  "roomNo": "ROOM123",
  "visitDate": "2026-03-20",
  "visitTime": "15:00",
  "userName": "홍길동",
  "userPhone": "010-1234-5678",
  "inquiry": "주차 가능 여부가 궁금합니다."
}
```

### Spring Payload Built By ai_server_new
```json
{
  "visitDate": "2026-03-20",
  "visitTime": "15:00:00",
  "message": "신청자명: 홍길동\n연락처: 010-1234-5678\n문의사항: 주차 가능 여부가 궁금합니다."
}
```

### Required ai_server_new Environment
```env
SPRING_BASE_URL=http://127.0.0.1:8080
SPRING_INTERNAL_API_KEY=
TOOL_EXECUTION_MODE=execute
```
