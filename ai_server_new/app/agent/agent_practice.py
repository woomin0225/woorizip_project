"""LangGraph/LangChain 에이전트 흐름을 익히기 위한 연습용 예제.

이 파일은 실서비스 코드라기보다 "에이전트가 어떻게 흘러가는지"를 공부하기 위한 샘플이다.
특히 아래 개념을 눈으로 따라가기에 좋다.

1. 모델이 답을 바로 할지, 도구를 쓸지 결정한다.
2. 도구 호출이 나오면 실제 파이썬 함수를 실행한다.
3. 실행 결과를 다시 모델에게 넘겨 최종 답을 만든다.
4. 이 과정을 LangGraph가 상태 기반 워크플로로 연결한다.

설치 예시:
- `pip install -U langgraph`
- `pip install -U langchain`
- `pip install -U langchain-google-genai`
- `pip install -U langchain-openai`

환경 변수 예시:
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
"""

from __future__ import annotations

from typing import Any

from langchain.messages import AnyMessage, HumanMessage, SystemMessage, ToolMessage
from langchain.tools import tool
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict


@tool
def multiply(a: int, b: int) -> int:
    """두 정수를 곱한다."""

    return a * b


@tool
def add(a: int, b: int) -> int:
    """두 정수를 더한다."""

    return a + b


@tool
def divide(a: int, b: int) -> float:
    """두 정수를 나눈다."""

    return a / b


# 에이전트가 사용할 도구 목록이다.
TOOLS = [multiply, add, divide]


class MessageState(TypedDict):
    """LangGraph가 노드 사이에서 전달하는 상태.

    `messages`:
    - 사람 메시지, AI 메시지, Tool 메시지가 차곡차곡 쌓인다.
    - `add_messages` 덕분에 각 노드가 새 메시지를 반환하면 기존 목록 뒤에 자동으로 붙는다.

    `llm_calls`:
    - 모델이 몇 번 호출되었는지 세어 보면
      도구 호출이 일어날 때 한 턴이 어떻게 여러 번 왕복되는지 이해하기 쉽다.
    """

    messages: Annotated[list[AnyMessage], add_messages]
    llm_calls: int


def build_demo_agent(model: Any):
    """주어진 채팅 모델로 도구 사용 에이전트를 만든다.

    함수로 감싼 이유는 Gemini/OpenAI 등 어떤 모델이든 같은 그래프 구조를 재사용하려는 의도다.
    즉, "모델"과 "에이전트 흐름"을 분리해서 보면 구조가 더 선명하게 보인다.
    """

    model_with_tools = model.bind_tools(TOOLS)
    tools_by_name = {tool_item.name: tool_item for tool_item in TOOLS}

    def llm_call(state: MessageState):
        """모델에게 현재 대화를 보여 주고 다음 행동을 결정하게 한다.

        여기서 모델은 두 가지 중 하나를 선택할 수 있다.
        - 바로 자연어 답변을 생성한다.
        - 특정 도구를 호출하라고 `tool_calls`를 남긴다.
        """

        response = model_with_tools.invoke(
            [SystemMessage(content="당신은 사칙연산을 도와주는 학습용 에이전트입니다.")]
            + state["messages"]
        )
        return {
            "messages": [response],
            "llm_calls": state.get("llm_calls", 0) + 1,
        }

    def tool_node(state: MessageState):
        """모델이 요청한 도구를 실제로 실행한다."""

        results = []
        for tool_call in state["messages"][-1].tool_calls:
            tool_impl = tools_by_name[tool_call["name"]]
            tool_result = tool_impl.invoke(tool_call["args"])
            results.append(
                ToolMessage(
                    content=str(tool_result),
                    tool_call_id=tool_call["id"],
                )
            )
        return {"messages": results}

    def should_continue(state: MessageState):
        """마지막 AI 메시지에 tool_calls가 있으면 도구 노드로, 없으면 종료한다."""

        last_message = state["messages"][-1]
        if last_message.tool_calls:
            return "tool_node"
        return END

    builder = StateGraph(MessageState)
    builder.add_node("llm_call", llm_call)
    builder.add_node("tool_node", tool_node)
    builder.add_edge(START, "llm_call")
    builder.add_edge("tool_node", "llm_call")
    builder.add_conditional_edges("llm_call", should_continue, ["tool_node", END])
    return builder.compile()


def build_gemini_model():
    """Gemini 기반 채팅 모델 예시를 만든다."""

    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(model="gemini-3-flash-preview")


def build_openai_model():
    """OpenAI 기반 채팅 모델 예시를 만든다."""

    from langchain.chat_models import init_chat_model

    return init_chat_model("gpt-5-nano")


if __name__ == "__main__":
    # 이 블록은 예제를 직접 실행할 때만 동작한다.
    # 실제로 실행하려면 위의 모델 빌더 중 하나를 선택하고 API 키를 환경 변수에 넣어야 한다.
    #
    # example_model = build_openai_model()
    # agent = build_demo_agent(example_model)
    # messages = [HumanMessage(content="3과 4를 더해줘")]
    # response = agent.invoke({"messages": messages, "llm_calls": 0})
    # print(response["messages"][-1].content)
    #
    # 위 흐름을 따라가며 보면,
    # 1) 사람이 질문하고
    # 2) 모델이 add 도구를 호출하고
    # 3) 도구 결과가 다시 모델로 들어가
    # 4) 최종 자연어 답변이 생성되는 과정을 이해할 수 있다.
    pass
