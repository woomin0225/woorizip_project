from __future__ import annotations

import base64

from app.clients.protocols import SpeechToTextClient, TextToSpeechClient


class MockSpeechToTextClient(SpeechToTextClient):
    async def transcribe(
        self,
        audio_base64: str,
        *,
        mime_type: str | None = None,
        language: str | None = None,
        mock_text: str | None = None,
    ) -> dict:
        raw = base64.b64decode(audio_base64.encode('ascii')) if audio_base64 else b''
        return {
            'text': mock_text or '테스트 음성 인식 결과',
            'language': language or 'ko',
            'mime_type': mime_type or 'audio/webm',
            'provider': 'mock',
            'audio_bytes': len(raw),
        }


class MockTextToSpeechClient(TextToSpeechClient):
    async def speak(
        self,
        text: str,
        *,
        voice: str | None = None,
        audio_format: str | None = None,
    ) -> dict:
        silent_wav = (
            b'RIFF$}\x00\x00WAVEfmt '
            b'\x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00}\x00\x00'
        )
        resolved_format = 'mp3' if audio_format == 'mpeg' else (audio_format or 'wav')
        resolved_mime = 'audio/mpeg' if resolved_format == 'mp3' else 'audio/wav'
        return {
            'text': text,
            'voice': voice or 'ko-KR-SunHiNeural',
            'audio_format': resolved_format,
            'mime_type': resolved_mime,
            'audio_base64': base64.b64encode(silent_wav).decode('ascii'),
            'provider': 'mock',
        }