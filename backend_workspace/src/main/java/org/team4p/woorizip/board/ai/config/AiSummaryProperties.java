package org.team4p.woorizip.board.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.summary")
public record AiSummaryProperties(
        String baseUrl,
        String apiKey,
        int connectTimeoutSeconds,
        int readTimeoutSeconds,
        long maxAttachmentBytes
) {
}
