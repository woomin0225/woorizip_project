from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header

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
    # CODEX-AZURE-TRACE-START
    logger.info(
        "TOUR_WORKFLOW_APPLY_RECEIVED sessionId=%s roomNo=%s roomName=%s visitDate=%s visitTime=%s preferredVisitAt=%s userNamePresent=%s userPhonePresent=%s",
        req.sessionId,
        req.roomNo,
        req.roomName,
        req.visitDate,
        req.visitTime,
        req.preferredVisitAt,
        bool(req.userName or ctx.get('user_name')),
        bool(req.userPhone or ctx.get('user_phone')),
    )
    # CODEX-AZURE-TRACE-END
    return await tour_service.apply_for_chatbot(
        req,
        access_token=None,
        default_user_name=ctx.get('user_name'),
        default_user_phone=ctx.get('user_phone'),
    )
