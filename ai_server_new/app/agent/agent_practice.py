# langgraph 패키지 설치
# https://docs.langchain.com/oss/python/langgraph/install
!pip install -U langgraph


# langchain 패키지 설치
!pip install -U langchain


# langchain-google-genai 패키지 설치
# https://docs.langchain.com/oss/python/integrations/providers/overview
!pip install langchain-google-genai


# os 환경 변수 GEMINI API KEY 입력
import os

os.environ["GEMINI_API_KEY"] = "..."


# 모델 객체 생성
# https://docs.langchain.com/oss/python/integrations/providers/google
from langchain_google_genai import ChatGoogleGenerativeAI

model = ChatGoogleGenerativeAI(model="gemini-3-flash-preview")


from langchain.tools import tool

@tool
def multiply(a: int, b: int) -> int:
    """Multiply `a` and `b`.

    Args:
        a: First int
        b: Second int
    """
    return a * b
@tool
def add(a: int, b: int) -> int:
    """Adds `a` and `b`.

    Args:
        a: First int
        b: Second int
    """
    return a + b
@tool
def divide(a: int, b: int) -> float:
    """Divide `a` and `b`.

    Args:
        a: First int
        b: Second int
    """
    return a / b


# tools 정의
tools=[multiply, add, divide]


# model - tool 바인딩
model_with_tools = model.bind_tools(tools)
    # tool이 연결된 새로운 model 객체 생성
    
    
# State 정의
# https://docs.langchain.com/oss/python/langgraph/quickstart#2-define-state
# 에이전트가 실행되는 동안 기록할 내용 정의 (데이터 스키마 정의)
from langchain.messages import AnyMessage
from typing_extensions import TypedDict, Annotated
from langgraph.graph.message import add_messages
# AnyMessage: Human msg, AI msg, Tool msg 상관없이 들어갈 수 있음
# add_messages: 새로운 메시지를 자동으로 list에 append하도록 함

class MessageState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    llm_calls: int  # 호출횟수
    
    
# llm_call 노드
from langchain.messages import SystemMessage

def llm_call(state):
    sys_msg = [SystemMessage(content="당신은 사칙연산을 하는 유능한 Agent입니다.")]
    
    response = model_with_tools.invoke(sys_msg + state["messages"])
    return {
        "messages": [response],
        "llm_calls": state.get("llm_calls", 0) + 1
    }
    
    
# tool 목록 생성
tools_by_name = { tool.name:tool for tool in tools }


# tool_node
from langchain.messages import ToolMessage

def tool_node(state):
    result=[]
    for tool_call in state["messages"][-1].tool_calls:
       tool = tools_by_name[tool_call['name']]
       tool_result = tool.invoke(tool_call["args"])
       
       result.append(ToolMessage(content=tool_result, tool_call_id=tool_call["id"]))
    return {"messages": result}


# 그래프 생성
from langgraph.graph import StateGraph, START

# 워크플로우(그래프) 생성
agent_builder = StateGraph(MessageState)
# 작업자 배치
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# 엣지 연결(노드간 연결)
agent_builder.add_edge(START, "llm_call")
agent_builder.add_edge("tool_node", "llm_call")


# 조건부 함수 작성
# 조건부 엣지를 작성하기 위해 조건부 함수 작성해야함
# "messages" 마지막에 tool_calls가 있으면 tool_node로, 없으면 end로.
from langgraph.graph import END

def should_continue(state: MessageState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tool_node"
    
    else:
        return END
    
    
# 조건부 엣지 연결
agent_builder.add_conditional_edges(
    "llm_call",     # 출발지
    should_continue,    # 판단 함수
    [END, "tool_node"]  # 가능한 종착지(판단함수에 등록된 return)
)


# 컴파일 (최종 에이전트 생성)
# 설계 도면대로 에이전트생성 + 그래프 끊어진 곳 없는지 검증 수행
agent = agent_builder.compile()

# 에러 없으면 성공


from langchain.messages import HumanMessage

messages = [HumanMessage(content="3과 4를 더해줘")]
response = agent.invoke({"messages": messages})


# GEMINI 응답 출력
response["messages"][-1].content[-1]["text"]




# ======== openai

!pip install -qU langchain-openai
os.environ["OPENAI_API_KEY"] = "..."

from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-5-nano")


model_with_tools = model.bind_tools(tools)


from langchain.messages import SystemMessage

def llm_call(state: MessageState):
    """LLM이 현재 상태를 보고 답변하거나, 도구 사용을 요청하는 Node"""

    # 시스템 메시지를 맨 앞에 추가하고 기존 대화 기록(state["messages"])을 뒤에 붙여서 LLM에게 전송
    response = model_with_tools.invoke(
        [
            SystemMessage(
                content="당신은 사칙연산을 하는 유능한 Agent입니다."
            )
        ] + state["messages"]
    )

    # 변경된 상태를 반환
    return {
        "messages": [response],
        "llm_calls": state.get('llm_calls', 0) + 1

    }
    
    
tools_by_name = {tool.name: tool for tool in tools}


from langchain.messages import ToolMessage

def tool_node(state):
    """LLM이 도구 사용을 요청했을 때, 실제로 도구를 실행하는 단계"""

    result = []
    # 가장 최근 메시지(LLM의 응답)에서 도구 호출 요청(tool_calls)들을 꺼내기
    for tool_call in state["messages"][-1].tool_calls:
        # 1. 도구 이름으로 실제 함수 찾기
        tool = tools_by_name[tool_call["name"]]

        # 2. 함수를 실행하여 결과를 얻기
        tool_result = tool.invoke(tool_call["args"])

        # 3. 결과를 ToolMessage 형태로 포장 (tool_call_id는 필수!)
        result.append(ToolMessage(content=tool_result, tool_call_id=tool_call["id"]))

    # 실행 결과를 대화 기록에 추가
    return {"messages": result}


from langgraph.graph import StateGraph, START

# 1. 워크플로우(그래프) 생성
agent_builder = StateGraph(State)

# 2. 노드(작업자) 배치
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# 3. 엣지(연결선) 연결
agent_builder.add_edge(START, "llm_call")
agent_builder.add_edge("tool_node", "llm_call")


from langgraph.graph import StateGraph, START, END

def should_continue(state: MessageState):
    """
    LLM의 응답을 보고 다음 단계로 어디를 갈지 결정
    """
    messages = state["messages"]
    last_message = messages[-1]

    # LLM이 도구 호출(tool_calls)을 포함한 응답을 보낸 경우
    if last_message.tool_calls:
        return "tool_node"

    # 도구 호출이 없으면 작업 종료
    return END


# 조건부 엣지 연결
agent_builder.add_conditional_edges(
    "llm_call",         # 출발지
    should_continue,    # 판단 로직 함수
    ["tool_node", END]  # 갈 수 있는 목적지들
)


# 컴파일 (최종 에이전트 생성)
agent = agent_builder.compile()


from langchain.messages import HumanMessage

messages = [HumanMessage(content="3과 4를 더해줘")]
response = agent.invoke({"messages": messages})