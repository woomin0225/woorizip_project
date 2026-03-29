from __future__ import annotations

import unittest

from app.clients.google_stt_client import GoogleCloudSTTClient
from app.clients.google_tts_client import GoogleCloudTTSClient


class GoogleSpeechClientConfigTests(unittest.TestCase):
    def test_stt_language_short_code_maps_to_locale(self):
        client = GoogleCloudSTTClient()
        self.assertEqual(client._normalize_language('ko'), 'ko-KR')

    def test_stt_detects_webm_encoding(self):
        client = GoogleCloudSTTClient()
        self.assertEqual(client._resolve_encoding('audio/webm;codecs=opus'), 'WEBM_OPUS')

    def test_tts_keeps_google_voice_name(self):
        client = GoogleCloudTTSClient()
        self.assertEqual(client._normalize_voice_name('ko-KR-Standard-A'), 'ko-KR-Standard-A')


if __name__ == '__main__':
    unittest.main()
