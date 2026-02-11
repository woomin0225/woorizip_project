package org.team4p.woorizip.auth.dto.response;

import java.time.Instant;

public record ErrorResponse(
        String code,
        String message,
        String path,
        Instant timestamp
) {
    public static ErrorResponse of(String code, String message, String path) {
        return new ErrorResponse(code, message, path, Instant.now());
    }
}
