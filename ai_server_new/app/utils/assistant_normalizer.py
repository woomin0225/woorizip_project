from __future__ import annotations

import json
import re
from typing import Any


MAX_TEXT_LENGTH = 4000
MAX_CONTEXT_LENGTH = 2200
MAX_SECTION_LENGTH = 1200

PAGE_CONTEXT_KEYWORDS = (
    '현재페이지', '현재 페이지', '이페이지', '이 페이지', '해당페이지', '해당 페이지',
    '지금페이지', '지금 페이지', '페이지', '화면', '여기', '여기서', '이곳',
    '버튼', '메뉴', '위치', '경로', '항목', '목록', '내용', '본문', '보이는',
    '요약', '정리', '설명', '무슨페이지', '무슨 페이지'
)
GENERAL_CHAT_KEYWORDS = (
    '안녕', '안녕하세요', '반가워', '반갑다', '도움이필요해', '도움이 필요해',
    '뭐할수있어', '뭐 할 수 있어', '무엇을할수있어', '무엇을 할 수 있어', '자기소개',
    '소개해줘', '고마워', '감사', '잘가', '이야기하자'
)


def compact_text(value: Any, max_length: int | None = None) -> str:
    text = re.sub(r'\s+', ' ', str(value or '')).strip()
    if max_length is None or len(text) <= max_length:
        return text
    return text[: max_length - 1].rstrip() + '…'


def normalize_context(context: dict[str, Any] | None) -> dict[str, Any]:
    context = context or {}
    normalized: dict[str, Any] = {}

    path = compact_text(context.get('path'), 200)
    if path:
        normalized['path'] = path

    page_snapshot = context.get('pageSnapshot')
    if isinstance(page_snapshot, dict):
        normalized_page = {
            'url': compact_text(page_snapshot.get('url'), 400),
            'title': compact_text(page_snapshot.get('title'), 200),
            'contentExcerpt': compact_text(
                page_snapshot.get('contentExcerpt'),
                MAX_CONTEXT_LENGTH,
            ),
        }
        normalized['pageSnapshot'] = {
            key: value for key, value in normalized_page.items() if value
        }

    site_profile = context.get('siteProfile')
    if isinstance(site_profile, dict):
        normalized_site = {
            'serviceName': compact_text(site_profile.get('serviceName'), 80),
            'channel': compact_text(site_profile.get('channel'), 40),
            'language': compact_text(site_profile.get('language'), 40),
        }
        normalized['siteProfile'] = {
            key: value for key, value in normalized_site.items() if value
        }

    return normalized


def should_include_page_context(text: str) -> bool:
    compact = compact_text(text, MAX_TEXT_LENGTH).lower().replace(' ', '')
    if not compact:
        return False

    if any(keyword.replace(' ', '') in compact for keyword in GENERAL_CHAT_KEYWORDS):
        if not any(keyword.replace(' ', '') in compact for keyword in PAGE_CONTEXT_KEYWORDS):
            return False

    return any(keyword.replace(' ', '') in compact for keyword in PAGE_CONTEXT_KEYWORDS)


def build_instruction(text: str, context: dict[str, Any]) -> str:
    user_text = compact_text(text, MAX_TEXT_LENGTH)
    if not context:
        return user_text

    parts = [user_text]
    site_profile = context.get('siteProfile') or {}
    if site_profile:
        lines = ['[SITE_PROFILE]']
        if site_profile.get('serviceName'):
            lines.append(f"service_name: {site_profile['serviceName']}")
        if site_profile.get('channel'):
            lines.append(f"channel: {site_profile['channel']}")
        if site_profile.get('language'):
            lines.append(f"language: {site_profile['language']}")
        lines.append('[/SITE_PROFILE]')
        parts.append('\n'.join(lines))

    page_snapshot = context.get('pageSnapshot') or {}
    if page_snapshot and should_include_page_context(user_text):
        lines = ['[CURRENT_PAGE_CONTEXT]']
        if page_snapshot.get('url'):
            lines.append(f"url: {page_snapshot['url']}")
        if page_snapshot.get('title'):
            lines.append(f"title: {page_snapshot['title']}")
        if page_snapshot.get('contentExcerpt'):
            lines.append(f"content_excerpt: {page_snapshot['contentExcerpt']}")
        lines.append('[/CURRENT_PAGE_CONTEXT]')
        parts.append('\n'.join(lines))

    return '\n\n'.join(part for part in parts if part)


def build_system_prompt(
    request_prompt: str | None,
    configured_prompt: str | None,
    base_info: str | None,
) -> str:
    parts: list[str] = []
    if compact_text(configured_prompt):
        parts.append(compact_text(configured_prompt, MAX_TEXT_LENGTH))
    elif compact_text(request_prompt):
        parts.append(compact_text(request_prompt, MAX_TEXT_LENGTH))

    if compact_text(base_info):
        parts.append(f'기본 정보:\n{compact_text(base_info, MAX_TEXT_LENGTH)}')

    return '\n\n'.join(parts)


def normalize_assistant_payload(payload: dict[str, Any]) -> dict[str, Any]:
    text = compact_text(payload.get('text'), MAX_TEXT_LENGTH)
    if not text:
        raise ValueError('text는 비어 있을 수 없습니다.')

    context = normalize_context(payload.get('context'))
    return {
        'schemaVersion': compact_text(payload.get('schemaVersion') or 'v1', 20),
        'sessionId': compact_text(payload.get('sessionId'), 120) or None,
        'clientRequestId': compact_text(payload.get('clientRequestId'), 120) or None,
        'userId': compact_text(payload.get('userId'), 120) or None,
        'text': text,
        'context': context,
        'instruction': build_instruction(text, context),
        'systemPrompt': compact_text(payload.get('systemPrompt'), MAX_TEXT_LENGTH)
        or None,
    }


def _stringify(value: Any, max_length: int = MAX_SECTION_LENGTH) -> str:
    if value is None:
        return ''
    if isinstance(value, str):
        return compact_text(value, max_length)
    if isinstance(value, (int, float, bool)):
        return str(value)
    try:
        return compact_text(
            json.dumps(value, ensure_ascii=False, default=str),
            max_length,
        )
    except TypeError:
        return compact_text(str(value), max_length)


def _extract_reply(raw: dict[str, Any]) -> str:
    for key in ('reply', 'outputText', 'message', 'output_text'):
        value = _stringify(raw.get(key))
        if value:
            return value

    data = raw.get('data')
    if isinstance(data, dict):
        for key in ('answer', 'summary', 'result', 'message'):
            value = _stringify(data.get(key))
            if value:
                return value
        if data.get('draft'):
            draft = _stringify(data.get('draft'))
            next_step = _stringify(data.get('next'))
            if next_step:
                return f'{draft}\n\n다음 단계: {next_step}'
            return draft

    if raw.get('draft'):
        return _stringify(raw.get('draft'))

    return '응답은 받았지만 표시 가능한 텍스트를 찾지 못했습니다.'


def _extract_intent(raw: dict[str, Any]) -> str:
    for key in ('intent', 'operation', 'actionType'):
        value = _stringify(raw.get(key), 80)
        if value:
            return value
    return 'fallback'


def _extract_action(raw: dict[str, Any]) -> dict[str, Any]:
    action = raw.get('action')
    if isinstance(action, dict):
        return action
    intent = _extract_intent(raw)
    stage = _stringify(raw.get('stage'), 40)
    if stage:
        return {'name': intent, 'stage': stage}
    return {'name': intent}


def normalize_assistant_response(
    raw: dict[str, Any],
    request_meta: dict[str, Any],
) -> dict[str, Any]:
    raw = raw or {}
    requires_confirm = bool(raw.get('requiresConfirm'))
    stage = _stringify(raw.get('stage'), 40)
    if stage == 'draft':
        requires_confirm = True

    return {
        'schemaVersion': request_meta.get('schemaVersion') or 'v1',
        'reply': _extract_reply(raw),
        'intent': _extract_intent(raw),
        'slots': raw.get('slots') if isinstance(raw.get('slots'), dict) else {},
        'action': _extract_action(raw),
        'result': raw.get('data') if isinstance(raw.get('data'), dict) else raw.get('result') or {},
        'errorCode': _stringify(raw.get('errorCode'), 80) or None,
        'requiresConfirm': requires_confirm,
        'sessionId': request_meta.get('sessionId'),
        'clientRequestId': request_meta.get('clientRequestId'),
        'raw': raw,
    }