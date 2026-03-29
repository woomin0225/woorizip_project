package org.team4p.woorizip.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record PageSummaryRequest(
        String title,
        @NotBlank(message = "text는 필수입니다.") String text,
        @Positive(message = "bullets는 1 이상이어야 합니다.") int bullets
) {
    public PageSummaryRequest {
        bullets = bullets <= 0 ? 3 : bullets;
    }
}
