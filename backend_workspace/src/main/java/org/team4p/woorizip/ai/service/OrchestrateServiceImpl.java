package org.team4p.woorizip.ai.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.HashMap;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.dto.OrchestrateCommandRequest;
import org.team4p.woorizip.ai.dto.OrchestrateCommandResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrchestrateServiceImpl implements OrchestrateService {

    private final AiServerClient aiServerClient;

    @Override
    public OrchestrateCommandResponse execute(OrchestrateCommandRequest request, String authorization) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("schemaVersion", request.schemaVersion() == null ? "v1" : request.schemaVersion());
        payload.put("text", request.text());
        payload.put("context", request.context() == null ? Map.of() : request.context());
        if (request.sessionId() != null) {
            payload.put("sessionId", request.sessionId());
        }
        if (request.clientRequestId() != null) {
            payload.put("clientRequestId", request.clientRequestId());
        }
        if (request.systemPrompt() != null) {
            payload.put("systemPrompt", request.systemPrompt());
        }

        Map<String, String> extraHeaders = new HashMap<>();
        if (StringUtils.hasText(authorization)) {
            extraHeaders.put("Authorization", authorization);
        }

        Map<String, Object> raw = aiServerClient.post("/ai/assistant/run", payload, extraHeaders);

        return new OrchestrateCommandResponse(
                asString(raw.get("schemaVersion")),
                asString(raw.get("reply")),
                asString(raw.get("intent")),
                asMap(raw.get("slots")),
                asMap(raw.get("action")),
                asMap(raw.get("result")),
                asString(raw.get("errorCode")),
                toBoolean(raw.get("requiresConfirm")),
                asString(raw.get("sessionId")),
                asString(raw.get("clientRequestId")),
                raw
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private boolean toBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }
}
