from __future__ import annotations

import base64
import binascii
import io
from typing import Any


TEXT_MIME_TYPES = {
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
}

PDF_MIME_TYPES = {'application/pdf'}
DOCX_MIME_TYPES = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}


class DocumentParseError(Exception):
    pass


class DocumentParser:
    def parse_attachment(self, attachment: dict[str, Any]) -> dict[str, Any]:
        filename = attachment.get('filename') or 'unknown'
        mime_type = (attachment.get('mime_type') or '').strip().lower()
        raw_text = attachment.get('text')
        base64_data = attachment.get('file_base64')

        if raw_text:
            text = self._normalize_text(str(raw_text))
            return {
                'filename': filename,
                'mime_type': mime_type or 'text/plain',
                'text': text,
                'chars': len(text),
                'source': 'text',
            }

        if not base64_data:
            raise DocumentParseError('text 또는 file_base64 중 하나는 필요합니다.')

        try:
            file_bytes = base64.b64decode(base64_data, validate=True)
        except (binascii.Error, ValueError) as exc:
            raise DocumentParseError('base64 디코딩에 실패했습니다.') from exc

        text = self._extract_text(file_bytes, mime_type=mime_type, filename=filename)
        return {
            'filename': filename,
            'mime_type': mime_type or self._infer_mime_from_filename(filename),
            'text': text,
            'chars': len(text),
            'source': 'file',
        }

    def _extract_text(self, file_bytes: bytes, mime_type: str, filename: str) -> str:
        effective_mime = mime_type or self._infer_mime_from_filename(filename)

        if effective_mime in TEXT_MIME_TYPES:
            return self._normalize_text(file_bytes.decode('utf-8', errors='ignore'))

        if effective_mime in PDF_MIME_TYPES or filename.lower().endswith('.pdf'):
            return self._extract_pdf_text(file_bytes)

        if effective_mime in DOCX_MIME_TYPES or filename.lower().endswith('.docx'):
            return self._extract_docx_text(file_bytes)

        raise DocumentParseError(f'지원하지 않는 첨부 형식입니다: {mime_type or filename}')

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        try:
            import fitz  # PyMuPDF
        except ImportError as exc:
            raise DocumentParseError('PyMuPDF가 설치되어 있지 않습니다.') from exc

        parts: list[str] = []
        try:
            with fitz.open(stream=file_bytes, filetype='pdf') as doc:
                for page in doc:
                    parts.append(page.get_text('text'))
        except Exception as exc:  # pragma: no cover
            raise DocumentParseError('PDF 텍스트 추출에 실패했습니다.') from exc
        return self._normalize_text('\n'.join(parts))

    def _extract_docx_text(self, file_bytes: bytes) -> str:
        try:
            from docx import Document
        except ImportError as exc:
            raise DocumentParseError('python-docx가 설치되어 있지 않습니다.') from exc

        try:
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text and p.text.strip()]
        except Exception as exc:  # pragma: no cover
            raise DocumentParseError('DOCX 텍스트 추출에 실패했습니다.') from exc
        return self._normalize_text('\n'.join(paragraphs))

    def _normalize_text(self, text: str) -> str:
        lines = [line.strip() for line in text.replace('\r', '\n').split('\n')]
        compact = [line for line in lines if line]
        return '\n'.join(compact)

    def _infer_mime_from_filename(self, filename: str) -> str:
        lowered = filename.lower()
        if lowered.endswith('.pdf'):
            return 'application/pdf'
        if lowered.endswith('.docx'):
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if lowered.endswith('.txt'):
            return 'text/plain'
        if lowered.endswith('.md'):
            return 'text/markdown'
        return 'application/octet-stream'
