package org.team4p.woorizip.ai.dto;

import java.util.List;
import java.util.Map;

public record SttTranscribeResponse(
        String text,
        String language,
        String mimeType,
        String provider,
        int audioBytes,
        List<String> warnings,
        Map<String, Object> raw
) {
}
