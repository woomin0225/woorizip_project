package org.team4p.woorizip.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record TtsSynthesizeRequest(
        @NotBlank(message = "text는 필수입니다.") String text,
        String voiceName
) {
}

