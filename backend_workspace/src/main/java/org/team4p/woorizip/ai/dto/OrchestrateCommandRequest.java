package org.team4p.woorizip.ai.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OrchestrateCommandRequest(
        String schemaVersion,
        @NotBlank(message = "text는 필수입니다.") String text,
        String sessionId,
        String clientRequestId,
        String systemPrompt,
        Map<String, Object> context
) {
}
