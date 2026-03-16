from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib import error, parse, request

from app.core.config import settings


class OpenAIAgentClient:
    def __init__(self):
        self.timeout_seconds = max(settings.AI_AGENT_TIMEOUT_MS, 1000) / 1000.0

    async def run(self, instruction: str, system_prompt: str | None = None) -> dict[str, Any]:
        return await asyncio.to_thread(
            self._run_sync,
            instruction,
            system_prompt,
        )

    def _run_sync(self, instruction: str, system_prompt: str | None = None) -> dict[str, Any]:
        endpoint = (settings.AI_AGENT_ENDPOINT or '').strip()
        if not endpoint:
            raise ValueError('AI_AGENT_ENDPOINT 설정이 필요합니다.')

        attempts = self._build_attempts(endpoint, instruction, system_prompt)
        error_parts: list[str] = []

        for url, payload in attempts:
            payload_bytes = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            headers = {
                'Content-Type': 'application/json',
                **self._build_auth_headers(),
            }
            req = request.Request(url, data=payload_bytes, headers=headers, method='POST')

            try:
                with request.urlopen(req, timeout=self.timeout_seconds) as resp:
                    body = resp.read().decode('utf-8')
                    return json.loads(body) if body else {}
            except error.HTTPError as exc:
                body = exc.read().decode('utf-8', errors='ignore')
                error_parts.append(f'url={url}, status={exc.code}, body={body}')
                if exc.code not in (404, 405):
                    raise ValueError('Agent API 호출 실패: ' + ' | '.join(error_parts)) from exc
            except error.URLError as exc:
                raise ValueError(f'Agent API 통신 중 오류가 발생했습니다: {exc.reason}') from exc

        raise ValueError('Agent API 호출 실패: ' + ' | '.join(error_parts))

    def _build_attempts(
        self,
        endpoint: str,
        instruction: str,
        system_prompt: str | None,
    ) -> list[tuple[str, dict[str, Any]]]:
        base = endpoint.rstrip('/')
        endpoint_path = self._normalize_path(settings.AI_AGENT_ENDPOINT_PATH)
        is_project_root = '.services.ai.azure.com/api/projects/' in base
        is_openai_root = '.openai.azure.com/openai/v1' in base

        if endpoint_path:
            attempts = [(base + endpoint_path, self._build_chat_payload(instruction, system_prompt))]
        elif is_project_root:
            attempts = [
                (base + '/chat/completions', self._build_chat_payload(instruction, system_prompt)),
                (base + '/models/chat/completions', self._build_chat_payload(instruction, system_prompt)),
                (base + '/responses', self._build_responses_payload(instruction, system_prompt)),
            ]
        elif is_openai_root:
            attempts = [
                (base + '/responses', self._build_responses_payload(instruction, system_prompt)),
                (base + '/chat/completions', self._build_chat_payload(instruction, system_prompt)),
            ]
        else:
            attempts = [(base, self._build_custom_payload(instruction, system_prompt))]

        unique: list[tuple[str, dict[str, Any]]] = []
        seen: set[str] = set()
        for raw_url, payload in attempts:
            url = self._with_api_version(raw_url)
            if url in seen:
                continue
            seen.add(url)
            unique.append((url, payload))
        return unique

    def _build_messages(self, instruction: str, system_prompt: str | None) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({'role': 'system', 'content': system_prompt})
        messages.append({'role': 'user', 'content': instruction})
        return messages

    def _build_chat_payload(self, instruction: str, system_prompt: str | None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            'stream': False,
            'messages': self._build_messages(instruction, system_prompt),
        }
        model = (settings.AI_AGENT_MODEL or '').strip()
        if model:
            payload['model'] = model
        return payload

    def _build_responses_payload(self, instruction: str, system_prompt: str | None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            'input': instruction,
        }
        if system_prompt:
            payload['instructions'] = system_prompt
        model = (settings.AI_AGENT_MODEL or '').strip()
        if model:
            payload['model'] = model
        return payload

    def _build_custom_payload(self, instruction: str, system_prompt: str | None) -> dict[str, Any]:
        return {
            'stream': False,
            'messages': self._build_messages(instruction, system_prompt),
        }

    def _build_auth_headers(self) -> dict[str, str]:
        mode = (settings.AI_AGENT_AUTH_MODE or 'none').strip().lower()
        if mode == 'none':
            return {}
        if mode == 'api_key':
            api_key = (settings.AI_AGENT_API_KEY or '').strip()
            if not api_key:
                raise ValueError('AI_AGENT_API_KEY 설정이 필요합니다.')
            return {'api-key': api_key}
        if mode == 'bearer':
            token = (settings.AI_AGENT_BEARER_TOKEN or '').strip()
            if not token:
                raise ValueError('AI_AGENT_BEARER_TOKEN 설정이 필요합니다.')
            return {'Authorization': f'Bearer {token}'}
        raise ValueError(f'지원하지 않는 AI_AGENT_AUTH_MODE 입니다: {settings.AI_AGENT_AUTH_MODE}')

    def _normalize_path(self, path: str | None) -> str | None:
        if not path:
            return None
        return path if path.startswith('/') else f'/{path}'

    def _with_api_version(self, endpoint: str) -> str:
        api_version = (settings.AI_AGENT_API_VERSION or '').strip()
        if not api_version or 'api-version=' in endpoint:
            return endpoint
        separator = '&' if '?' in endpoint else '?'
        return (
            endpoint
            + separator
            + 'api-version='
            + parse.quote(api_version, safe='')
        )
