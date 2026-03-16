# app/services/summary_service.py

from app.ibm.groq_llm_client import GroqLLMClient
from app.utils.document_parser import DocumentParseError, DocumentParser
import json
import re

class SummaryService:
    def __init__(self, llm: GroqLLMClient):
        self.llm = llm
        self.document_parser = DocumentParser()
        
    def _normalize_extracted_text(self, text: str) -> str:
        if not text:
            return ''

        normalized = text.replace('\r\n', '\n').replace('\r', '\n')
        normalized = normalized.replace('\x00', ' ')

        lines: list[str] = []
        for raw_line in normalized.split('\n'):
            line = re.sub(r'\s+', ' ', raw_line).strip()
            if not line:
                continue
            lines.append(line)

        return '\n'.join(lines)

    def _detect_document_styles(self, title: str | None, text: str) -> list[str]:
        source = f'{title or ""}\n{text or ""}'.lower()

        styles: list[str] = []

        guide_keywords = [
            '안내문', '절차', '체크리스트', '유의사항', '확인 항목',
            '이용 방법', '신청 방법', '제출 방법'
        ]
        policy_keywords = [
            '정책', '지원 대상', '신청 자격', '제외 대상', '의무사항', '유효기간'
        ]
        faq_keywords = [
            'faq', '자주 묻는 질문', 'q.', 'a.'
        ]
        report_keywords = [
            '분석', '성과', '결과', '요약 보고', '현황', '통계'
        ]
        table_keywords = [
            '구분', '항목', '비고', '표', '목록'
        ]

        if any(keyword in source for keyword in guide_keywords) or re.search(r'1\s*단계|2\s*단계|3\s*단계|4\s*단계', source):
            styles.append('guide')

        if any(keyword in source for keyword in policy_keywords):
            styles.append('policy')

        if any(keyword in source for keyword in faq_keywords):
            if '자주 묻는 질문' in source or 'faq' in source or (source.count('q.') >= 2 and source.count('a.') >= 2):
                styles.append('faq')

        if any(keyword in source for keyword in report_keywords):
            styles.append('report')

        if any(keyword in source for keyword in table_keywords):
            styles.append('table')

        if not styles:
            styles.append('general')

        return styles

    def _select_document_style(self, title: str | None, body_text: str, attachment_texts: list[str]) -> str:
        scores: dict[str, int] = {
            'general': 0,
            'guide': 0,
            'policy': 0,
            'faq': 0,
            'report': 0,
            'table': 0,
        }

        for style in self._detect_document_styles(title, body_text):
            scores[style] = scores.get(style, 0) + 2

        for text in attachment_texts:
            for style in self._detect_document_styles(None, text):
                scores[style] = scores.get(style, 0) + 1

        priority = ['guide', 'policy', 'faq', 'report', 'table', 'general']
        best_style = 'general'
        best_score = -1

        for style in priority:
            score = scores.get(style, 0)
            if score > best_score:
                best_style = style
                best_score = score

        return best_style

    def _build_post_system_prompt(self, *, style: str, bullets: int) -> str:
        common = (
            "반드시 JSON 객체만 반환하라. 설명문, 코드블록, 머리말 없이 JSON만 출력하라.\n"
            "형식:\n"
            "{\n"
            '  "summary": "2~3문장 요약",\n'
            '  "key_points": ["핵심 포인트"],\n'
            '  "conclusion": "한 문장 결론",\n'
            '  "schedules": ["실제 날짜/시간/기한"],\n'
            '  "action_items": []\n'
            "}\n"
            f"key_points는 최대 {min(bullets, 3)}개까지 작성하라. "
            "실제 날짜/시간/기한이 없는 경우 schedules는 빈 배열로 반환하라. "
            "summary는 3문장을 넘기지 말고, key_points는 각 항목을 짧게 작성하라. "
            "conclusion은 반드시 1문장만 작성하라. "
            "action_items는 항상 빈 배열로 반환하라."
        )

        prompts = {
            'guide': (
                "너는 한국어 안내문/절차형 문서를 요약하는 전문가다. "
                "문서 목적, 확인 절차, 체크리스트, 유의사항을 우선 정리하라. "
                "표와 단계형 문서는 순서를 보존해서 이해하라. "
                + common
            ),
            'policy': (
                "너는 한국어 정책/기준 문서를 요약하는 전문가다. "
                "적용 대상, 핵심 기준, 신청 또는 이용 조건, 제외 또는 주의사항을 우선 정리하라. "
                + common
            ),
            'faq': (
                "너는 한국어 FAQ/질문답변 문서를 요약하는 전문가다. "
                "반복 질문의 공통 핵심을 묶어서 정리하고, 사용자 관점에서 중요한 답변을 우선 요약하라. "
                + common
            ),
            'report': (
                "너는 한국어 보고서/분석 문서를 요약하는 전문가다. "
                "문서 목적, 주요 결과, 핵심 시사점, 결론을 우선 정리하라. "
                + common
            ),
            'table': (
                "너는 한국어 표/목록형 문서를 요약하는 전문가다. "
                "열거된 항목의 공통 구조를 파악하고 비교 포인트와 핵심 항목을 정리하라. "
                + common
            ),
            'general': (
                "너는 게시글과 첨부자료를 함께 읽고 요약하는 한국어 요약 전문가다. "
                "본문과 첨부를 함께 반영해서 중복 없이 간결하게 정리하라. "
                + common
            ),
        }

        return prompts.get(style, prompts['general'])

    def _build_post_extra_instruction(self, style: str) -> str:
        if style == 'guide':
            return (
                "안내문/절차형 문서이면 '무엇을 어디서 어떻게 확인해야 하는지'를 중심으로 요약하라. "
                "실제 일정이 아니라 확인해야 할 일정 항목만 있을 경우 schedules를 비워라."
            )
        if style == 'policy':
            return (
                "정책/기준 문서이면 대상, 조건, 제한사항, 준비사항을 우선 정리하라."
            )
        if style == 'faq':
            return (
                "FAQ 문서이면 유사 질문을 묶어서 사용자가 바로 이해할 수 있게 요약하라."
            )
        if style == 'report':
            return (
                "보고서형 문서이면 목적, 결과, 결론, 시사점을 우선 정리하라."
            )
        if style == 'table':
            return (
                "표/목록형 문서이면 항목 간 비교 포인트와 중요한 열의 의미를 정리하라."
            )
        return (
            "첨부파일 내용이 있으면 반드시 본문과 함께 반영해서 요약하라."
        )
        
    def _extract_json_text(self, raw: str) -> str:
        text = (raw or '').strip()
        if not text:
            return '{}'

        fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fenced:
            return fenced.group(1).strip()

        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            return text[start:end + 1].strip()

        return text

    def _to_list(self, value) -> list[str]:
        if value is None:
            return []

        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]

        if isinstance(value, str):
            value = value.strip()
            if not value or value == '없음':
                return []

            items = []
            for line in value.splitlines():
                cleaned = line.strip().lstrip('-').lstrip('•').strip()
                if cleaned and cleaned != '없음':
                    items.append(cleaned)
            return items

        return [str(value).strip()]

    def _parse_json_response(
        self,
        raw: str,
        *,
        fallback_summary: str = '',
        extra: dict | None = None,
    ) -> dict:
        try:
            parsed = json.loads(self._extract_json_text(raw))
            result = {
                'summary': str(parsed.get('summary') or fallback_summary or '').strip(),
                'key_points': self._to_list(parsed.get('key_points')),
                'conclusion': str(parsed.get('conclusion') or '').strip(),
                'schedules': self._to_list(parsed.get('schedules')),
                'action_items': self._to_list(parsed.get('action_items')),
            }

            if not result['summary']:
                result['summary'] = fallback_summary or (raw or '').strip()

            if extra:
                result.update(extra)

            return result

        except Exception:
            partial = self._extract_partial_json_fields(raw)

            result = {
                'summary': partial.get('summary') or fallback_summary or (raw or '').strip(),
                'key_points': partial.get('key_points') or [],
                'conclusion': partial.get('conclusion') or '',
                'schedules': partial.get('schedules') or [],
                'action_items': partial.get('action_items') or [],
                'raw_output': raw,
            }

            if extra:
                result.update(extra)

            return result

    async def summarize_text(self, title: str | None, text: str, bullets: int = 5) -> dict:
        clipped_text = self._clip_text(self._normalize_extracted_text(text or ''), limit=12000)

        system = (
            "너는 한국어 요약 전문가다. "
            "반드시 JSON 객체만 반환하라. 설명문, 코드블록, 머리말 없이 JSON만 출력하라.\n"
            "형식:\n"
            "{\n"
            '  "summary": "전체 요약 2~4문장",\n'
            '  "key_points": ["핵심 포인트"],\n'
            '  "conclusion": "한 문장 결론",\n'
            '  "schedules": ["일정/기한"],\n'
            '  "action_items": ["해야 할 일"]\n'
            "}\n"
            f"key_points는 최대 {bullets}개까지 작성하고, 없으면 빈 배열로 반환하라. "
            "schedules, action_items도 없으면 빈 배열로 반환하라."
        )
        user = f"[제목]\n{title or ''}\n\n[본문]\n{clipped_text}"

        out = await self.llm.chat(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.2,
            max_new_tokens=1000,
        )

        return self._parse_json_response(
            out,
            fallback_summary=(out or '').strip(),
            extra={
                'title': title,
                'bullets': bullets,
            },
        )

    async def summarize_post(
        self,
        title: str | None,
        text: str,
        attachments: list[dict] | None = None,
        bullets: int = 5,
    ) -> dict:
        parsed_attachments: list[dict] = []
        warnings: list[str] = []

        for attachment in attachments or []:
            filename = attachment.get('filename') or 'unknown'
            try:
                parsed = self.document_parser.parse_attachment(attachment)
                parsed['text'] = self._normalize_extracted_text(parsed.get('text') or '')
                parsed_attachments.append(parsed)
            except DocumentParseError as exc:
                warnings.append(f'{filename}: {str(exc)}')

        body_text = self._clip_text(
            self._normalize_extracted_text(text or ''),
            limit=4000,
        )

        attachment_sections = []
        attachment_texts: list[str] = []

        for item in parsed_attachments:
            attachment_text = item.get('text') or ''
            attachment_texts.append(attachment_text)

            clipped = self._clip_text(attachment_text, limit=2000)
            attachment_sections.append(
                f"[첨부파일] {item['filename']}\n"
                f"mime_type={item.get('mime_type') or ''}, chars={item.get('chars', 0)}\n"
                f"내용:\n{clipped}"
            )

        document_style = self._select_document_style(title, body_text, attachment_texts)
        attachment_text = '\n\n'.join(attachment_sections) if attachment_sections else '첨부파일 없음'

        system = self._build_post_system_prompt(style=document_style, bullets=bullets)
        extra_instruction = self._build_post_extra_instruction(document_style)

        user = (
            f"[문서 유형]\n{document_style}\n\n"
            f"[게시글 제목]\n{title or ''}\n\n"
            f"[게시글 본문]\n{body_text or '(본문 없음)'}\n\n"
            f"[첨부자료]\n{attachment_text}\n\n"
            f"[추가 지시]\n{extra_instruction}"
        )

        out = await self.llm.chat(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.15,
            max_new_tokens=2400,
        )

        return self._parse_json_response(
            out,
            fallback_summary=(out or '').strip(),
            extra={
                'title': title,
                'bullets': bullets,
                'attachment_count': len(parsed_attachments),
                'attachments': [
                    {
                        'filename': item['filename'],
                        'mime_type': item.get('mime_type'),
                        'chars': item.get('chars', 0),
                    }
                    for item in parsed_attachments
                ],
                'warnings': warnings,
                'document_style': document_style,
            },
        )

    async def summarize_room(
        self,
        room_id: str | None,
        room: dict,
        reviews: list[dict] | None = None,
        photos_caption: str | None = None,
        bullets: int = 6,
    ) -> dict:
        payload = {
            'room_id': room_id,
            'room': room,
            'reviews': reviews or [],
            'photos_caption': photos_caption or '',
        }

        system = (
            "너는 부동산/주거 플랫폼의 매물 요약가다. "
            "반드시 JSON 객체만 반환하라. 설명문, 코드블록, 머리말 없이 JSON만 출력하라.\n"
            "형식:\n"
            "{\n"
            '  "summary": "매물 한줄 요약 또는 2~3문장 요약",\n'
            '  "key_points": ["장점/단점/특징"],\n'
            '  "conclusion": "추천 대상과 주의사항 요약",\n'
            '  "schedules": [],\n'
            '  "action_items": []\n'
            "}\n"
            f"key_points는 최대 {bullets}개까지 작성하라."
        )

        user = f"INPUT_JSON:\n{json.dumps(payload, ensure_ascii=False)}"

        out = await self.llm.chat(
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.25,
            max_new_tokens=1000,
        )

        return self._parse_json_response(
            out,
            fallback_summary=(out or '').strip(),
            extra={
                'room_id': room_id,
            },
        )

    def _clip_text(self, text: str, limit: int) -> str:
        if len(text) <= limit:
            return text
        return text[:limit] + '\n...[truncated]'

    def _extract_partial_json_fields(self, raw: str) -> dict:
        text = (raw or '').strip()

        def extract_string(field: str) -> str:
            m = re.search(rf'"{field}"\s*:\s*"((?:[^"\\]|\\.)*)"', text, re.DOTALL)
            if not m:
                return ''
            return bytes(m.group(1), 'utf-8').decode('unicode_escape').strip()

        def extract_list(field: str) -> list[str]:
            m = re.search(rf'"{field}"\s*:\s*\[(.*?)\]', text, re.DOTALL)
            if not m:
                return []
            block = m.group(1)
            items = re.findall(r'"((?:[^"\\]|\\.)*)"', block, re.DOTALL)
            return [bytes(item, 'utf-8').decode('unicode_escape').strip() for item in items if item.strip()]

        return {
            'summary': extract_string('summary'),
            'key_points': extract_list('key_points'),
            'conclusion': extract_string('conclusion'),
            'schedules': extract_list('schedules'),
            'action_items': extract_list('action_items'),
        }
