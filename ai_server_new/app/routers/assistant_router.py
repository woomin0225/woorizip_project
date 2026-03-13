from __future__ import annotations

from fastapi import APIRouter, Depends

from app.clients.openai_agent_client import OpenAIAgentClient
from app.core.security import get_user_context, require_internal_api_key
from app.schemas import AssistantRunReq, AssistantRunRes
from app.services.assistant_service import AssistantService


router = APIRouter(prefix='/ai', tags=['assistant'])
assistant_service = AssistantService(OpenAIAgentClient())


@router.post(
    '/assistant/run',
    dependencies=[Depends(require_internal_api_key)],
    response_model=AssistantRunRes,
)
@router.post(
    '/agent/run',
    dependencies=[Depends(require_internal_api_key)],
    response_model=AssistantRunRes,
    include_in_schema=False,
)
async def run_assistant(req: AssistantRunReq, ctx: dict = Depends(get_user_context)):
    request = req.model_copy(
        update={
            'userId': req.userId or ctx.get('user_id'),
        }
    )
    return await assistant_service.run(request)
