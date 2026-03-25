from __future__ import annotations

from fastapi import APIRouter, Depends, Header

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
async def run_assistant(
    req: AssistantRunReq,
    authorization: str | None = Header(default=None),
    ctx: dict = Depends(get_user_context),
):
    access_token = None
    if authorization and authorization.lower().startswith('bearer '):
        access_token = authorization[7:].strip()
    elif req.accessToken:
        access_token = str(req.accessToken).strip() or None

    next_context = dict(req.context or {})
    user_profile = dict(next_context.get('userProfile') or {})
    if ctx.get('user_name'):
        user_profile['userName'] = ctx.get('user_name')
    if ctx.get('user_phone'):
        user_profile['userPhone'] = ctx.get('user_phone')
    if user_profile:
        next_context['userProfile'] = user_profile

    request = req.model_copy(
        update={
            'userId': req.userId or ctx.get('user_id'),
            'context': next_context,
            'accessToken': access_token,
        }
    )
    return await assistant_service.run(request, access_token=access_token)
