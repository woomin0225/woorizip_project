from __future__ import annotations

import logging
from typing import Any

from app.agent.azure_workflow_session_store import (
    AzureWorkflowSessionStore,
    shared_azure_workflow_session_store,
)
from app.clients.openai_agent_client import OpenAIAgentClient
from app.core.config import settings
from app.utils.assistant_normalizer import build_instruction

TOUR_APPLY_WORKFLOW_HINT = "TOUR_APPLY"
TERMINAL_ACTION_STATUSES = {
    "submitted",
    "done",
    "completed",
    "cancelled",
    "canceled",
    "rejected",
    "failed",
}
TERMINAL_REPLY_TOKENS = (
    "application completed",
    "tour apply completed",
    "cancelled",
    "canceled",
)

logger = logging.getLogger(__name__)


class AzureTourWorkflowService:
    def __init__(
        self,
        client: OpenAIAgentClient,
        store: AzureWorkflowSessionStore | None = None,
    ) -> None:
        self.client = client
        self.store = store or shared_azure_workflow_session_store

    def should_handle(self, payload: dict[str, Any]) -> bool:
        if not self._has_workflow_application_config():
            return False

        session_id = str(payload.get("sessionId") or "")
        if session_id and self.store.get(session_id):
            return True

        workflow_hint = str(payload.get("workflowHint") or "").strip().upper()
        return workflow_hint == TOUR_APPLY_WORKFLOW_HINT

    async def run(
        self,
        payload: dict[str, Any],
        *,
        system_prompt: str | None = None,
    ) -> dict[str, Any]:
        session_id = str(payload.get("sessionId") or "")
        conversation_state = self.store.get(session_id)
        next_payload = self._merge_payload_context(payload, conversation_state)
        raw = await self.client.run(
            instruction=next_payload["instruction"],
            system_prompt=system_prompt,
            conversation_state=conversation_state or None,
        )
        self._update_session_state(
            session_id,
            raw,
            next_payload,
            next_payload.get("context"),
        )
        return raw

    def _update_session_state(
        self,
        session_id: str,
        raw: dict[str, Any],
        payload: dict[str, Any] | None = None,
        context: dict[str, Any] | None = None,
    ) -> None:
        if not session_id:
            return

        response_id = str(raw.get("responseId") or raw.get("id") or "").strip()
        if not response_id:
            return

        if self._is_terminal_response(raw):
            self.store.delete(session_id)
            return

        next_state = {
            "previousResponseId": response_id,
            **self._extract_context_state(context, payload),
        }
        self.store.set(session_id, next_state)

    def _is_terminal_response(self, raw: dict[str, Any]) -> bool:
        action = raw.get("action")
        if isinstance(action, dict):
            status = str(action.get("status") or "").strip().lower()
            if status in TERMINAL_ACTION_STATUSES:
                return True

        reply = str(raw.get("reply") or raw.get("output_text") or "").strip().lower()
        return any(token in reply for token in TERMINAL_REPLY_TOKENS)

    def _has_workflow_application_config(self) -> bool:
        endpoint = str(settings.AI_AGENT_ENDPOINT or "").strip()
        endpoint_path = str(settings.AI_AGENT_ENDPOINT_PATH or "").strip()
        agent_reference_name = str(settings.AI_AGENT_REFERENCE_NAME or "").strip()
        agent_reference_version = str(settings.AI_AGENT_REFERENCE_VERSION or "").strip()
        if not endpoint:
            return False
        if "/applications/" in endpoint:
            return True
        if "/applications/" in endpoint_path:
            return True
        return bool(agent_reference_name and agent_reference_version)

    def _merge_payload_context(
        self,
        payload: dict[str, Any],
        conversation_state: dict[str, Any],
    ) -> dict[str, Any]:
        next_payload = dict(payload)
        current_context = dict(payload.get("context") or {})
        saved_context = self._restore_context_state(conversation_state)

        merged_context = {**saved_context, **current_context}
        if merged_context:
            next_payload["context"] = merged_context
            next_payload["instruction"] = build_instruction(
                str(next_payload.get("text") or ""),
                merged_context,
            )

        # CODEX-AZURE-TRACE-START
        logger.info(
            "AZURE_WORKFLOW_CONTEXT sessionId=%s roomNo=%s roomName=%s restored=%s",
            payload.get("sessionId"),
            merged_context.get("roomNo"),
            merged_context.get("roomName"),
            bool(saved_context and not current_context.get("roomNo")),
        )
        # CODEX-AZURE-TRACE-END
        return next_payload

    def _extract_context_state(
        self,
        context: dict[str, Any] | None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        context = context or {}
        payload = payload or {}
        state: dict[str, Any] = {}
        room_no = str(context.get("roomNo") or "").strip()
        room_name = str(context.get("roomName") or "").strip()
        user_id = str(payload.get("userId") or context.get("userId") or "").strip()
        if room_no:
            state["roomNo"] = room_no
        if room_name:
            state["roomName"] = room_name
        if user_id:
            state["userId"] = user_id
        current_room_resolved = context.get("currentRoomResolved")
        if isinstance(current_room_resolved, bool):
            state["currentRoomResolved"] = current_room_resolved
        user_profile = context.get("userProfile")
        if isinstance(user_profile, dict):
            state["userProfile"] = {
                key: value
                for key, value in user_profile.items()
                if key in {"userName", "userPhone"} and str(value or "").strip()
            }
        return state

    def _restore_context_state(self, state: dict[str, Any]) -> dict[str, Any]:
        restored: dict[str, Any] = {}
        if str(state.get("roomNo") or "").strip():
            restored["roomNo"] = str(state["roomNo"]).strip()
        if str(state.get("roomName") or "").strip():
            restored["roomName"] = str(state["roomName"]).strip()
        if isinstance(state.get("currentRoomResolved"), bool):
            restored["currentRoomResolved"] = state["currentRoomResolved"]
        user_profile = state.get("userProfile")
        if isinstance(user_profile, dict) and user_profile:
            restored["userProfile"] = dict(user_profile)
        return restored
