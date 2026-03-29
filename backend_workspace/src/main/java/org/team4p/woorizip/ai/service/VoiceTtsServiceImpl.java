package org.team4p.woorizip.ai.service;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.dto.TtsSynthesizeRequest;
import org.team4p.woorizip.ai.dto.TtsSynthesizeResult;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VoiceTtsServiceImpl implements VoiceTtsService {

    private final AiServerClient aiServerClient;

    @Override
    public TtsSynthesizeResult synthesize(TtsSynthesizeRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("text", request.text());
        if (StringUtils.hasText(request.voiceName())) {
            payload.put("voice", request.voiceName());
        }

        Map<String, Object> raw = aiServerClient.post("/ai/voice/speak", payload);

        String audioBase64 = asString(raw.get("audioBase64"));
        if (!StringUtils.hasText(audioBase64)) {
            throw new IllegalArgumentException("AI TTS 응답에 audioBase64가 없습니다.");
        }
        String mimeType = asString(raw.get("mimeType"));
        return new TtsSynthesizeResult(
                Base64.getDecoder().decode(audioBase64),
                StringUtils.hasText(mimeType) ? mimeType : "audio/wav"
        );
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
