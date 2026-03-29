from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header

from app.agent.azure_workflow_session_store import shared_azure_workflow_session_store
from app.clients.spring_tour_client import SpringTourClient
from app.core.security import get_user_context, require_internal_api_key
from app.schemas import AssistantRunRes, TourApplyReq, TourApplyRes, TourWorkflowApplyReq
from app.services.tour_service import TourService


router = APIRouter(prefix='/ai', tags=['tour'])
tour_service = TourService(SpringTourClient())
logger = logging.getLogger(__name__)


@router.post(
    '/tour/apply',
    dependencies=[Depends(require_internal_api_key)],
    response_model=TourApplyRes,
)
async def apply_tour(
    req: TourApplyReq,
    authorization: str | None = Header(default=None),
):
    access_token = None
    if authorization and authorization.lower().startswith('bearer '):
        access_token = authorization[7:].strip()
    return await tour_service.apply(req, access_token=access_token)


@router.post(
    '/tour/workflow/apply',
    dependencies=[Depends(require_internal_api_key)],
    response_model=AssistantRunRes,
)
async def apply_tour_from_workflow(
    req: TourWorkflowApplyReq,
    authorization: str | None = Header(default=None),
    ctx: dict = Depends(get_user_context),
):
    session_state = shared_azure_workflow_session_store.get(req.sessionId or '')
    session_user_profile = session_state.get('userProfile') if isinstance(session_state.get('userProfile'), dict) else {}
    resolved_user_id = req.userId or ctx.get('user_id') or session_state.get('userId')
    resolved_user_name = req.userName or ctx.get('user_name') or session_user_profile.get('userName')
    resolved_user_phone = req.userPhone or ctx.get('user_phone') or session_user_profile.get('userPhone')
    # CODEX-AZURE-TRACE-START
    logger.info(
        "TOUR_WORKFLOW_APPLY_RECEIVED sessionId=%s roomNo=%s roomName=%s visitDate=%s visitTime=%s preferredVisitAt=%s userIdPresent=%s userNamePresent=%s userPhonePresent=%s sessionRestoreUsed=%s",
        req.sessionId,
        req.roomNo,
        req.roomName,
        req.visitDate,
        req.visitTime,
        req.preferredVisitAt,
        bool(resolved_user_id),
        bool(resolved_user_name),
        bool(resolved_user_phone),
        bool(req.sessionId and session_state),
    )
    # CODEX-AZURE-TRACE-END
    return await tour_service.apply_for_chatbot(
        req,
        access_token=None,
        default_user_id=resolved_user_id,
        default_user_name=resolved_user_name,
        default_user_phone=resolved_user_phone,
    )
