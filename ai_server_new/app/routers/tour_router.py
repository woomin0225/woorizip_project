from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from app.clients.spring_tour_client import SpringTourClient
from app.core.security import get_user_context, require_internal_api_key
from app.schemas import AssistantRunRes, TourApplyReq, TourApplyRes, TourWorkflowApplyReq
from app.services.tour_service import TourService


router = APIRouter(prefix='/ai', tags=['tour'])
tour_service = TourService(SpringTourClient())


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
    access_token = None
    if authorization and authorization.lower().startswith('bearer '):
        access_token = authorization[7:].strip()
    return await tour_service.apply_for_chatbot(
        req,
        access_token=access_token,
        default_user_name=ctx.get('user_name'),
        default_user_phone=ctx.get('user_phone'),
    )
