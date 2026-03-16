package org.team4p.woorizip.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record SttTranscribeRequest(
        @NotBlank(message = "audioBase64는 필수입니다.") String audioBase64,
        String mimeType,
        String language,
        String mockText
) {
}
