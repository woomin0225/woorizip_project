package org.team4p.woorizip.ai.dto;

public record TtsSynthesizeResult(
        byte[] audioBytes,
        String mimeType
) {
}
