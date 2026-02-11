package org.team4p.woorizip.auth.token.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        long accessExp,
        long refreshExp
) {}
