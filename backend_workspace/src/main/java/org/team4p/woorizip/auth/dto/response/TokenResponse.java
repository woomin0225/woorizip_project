package org.team4p.woorizip.auth.dto.response;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        long accessExpiresInMs,
        long refreshExpiresInMs
) {}
