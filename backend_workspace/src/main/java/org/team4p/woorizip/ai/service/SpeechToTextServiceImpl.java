package org.team4p.woorizip.ai.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.ai.dto.SttTranscribeRequest;
import org.team4p.woorizip.ai.dto.SttTranscribeResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SpeechToTextServiceImpl implements SpeechToTextService {

    private final AiServerClient aiServerClient;

    @Override
    public SttTranscribeResponse transcribe(SttTranscribeRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("audio_base64", request.audioBase64());
        payload.put("mime_type", request.mimeType() == null ? "audio/webm" : request.mimeType());
        payload.put("language", request.language() == null ? "ko" : request.language());
        if (request.mockText() != null) {
            payload.put("mock_text", request.mockText());
        }

        Map<String, Object> raw = aiServerClient.post("/ai/voice/transcribe", payload);

        List<String> warnings = raw.get("warnings") instanceof List<?> list
                ? list.stream().map(String::valueOf).toList()
                : Collections.emptyList();

        return new SttTranscribeResponse(
                asString(raw.get("text")),
                asString(raw.get("language")),
                asString(raw.get("mimeType")),
                asString(raw.get("provider")),
                toInt(raw.get("audioBytes")),
                warnings,
                raw
        );
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private int toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
