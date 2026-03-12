package org.team4p.woorizip.ai.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpRequest.BodyPublishers;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.config.AgentProperties;
import org.team4p.woorizip.ai.dto.OrchestrateCommandRequest;
import org.team4p.woorizip.ai.dto.OrchestrateCommandResponse;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrchestrateServiceImpl implements OrchestrateService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};
    private static final String SCHEMA_VERSION = "v1";
    private static final String INTENT_FALLBACK = "fallback";

    private final AgentProperties properties;
    private final ObjectMapper objectMapper;

    @Override
    public OrchestrateCommandResponse execute(OrchestrateCommandRequest request) {
        if (properties.isMockEnabled()) {
            return buildMockResponse(request);
        }
        if (!StringUtils.hasText(properties.getEndpoint())) {
            throw new IllegalArgumentException("AI_AGENT_ENDPOINT(ai.agent.endpoint) 설정이 필요합니다.");
        }

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                    .build();
            List<EndpointAttempt> attempts = buildAttempts(request);
            String authHeaderName = resolveAuthHeaderName();
            String authHeaderValue = resolveAuthHeaderValue();
            StringBuilder errorSummary = new StringBuilder();

            for (EndpointAttempt attempt : attempts) {
                String endpoint = withApiVersion(attempt.url(), properties.getApiVersion());
                String requestJson = objectMapper.writeValueAsString(attempt.payload());

                HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(endpoint))
                        .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                        .header("Content-Type", "application/json")
                        .POST(BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8));

                if (StringUtils.hasText(authHeaderName) && StringUtils.hasText(authHeaderValue)) {
                    builder.header(authHeaderName, authHeaderValue);
                }

                HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    Map<String, Object> raw = parseJson(response.body());
                    return new OrchestrateCommandResponse(
                            SCHEMA_VERSION,
                            extractReply(raw),
                            extractIntent(raw),
                            extractMap(raw, "slots"),
                            extractMap(raw, "action"),
                            extractMap(raw, "result"),
                            extractErrorCode(raw),
                            extractRequiresConfirm(raw),
                            request.sessionId(),
                            request.clientRequestId(),
                            raw
                    );
                }

                if (errorSummary.length() > 0) {
                    errorSummary.append(" | ");
                }
                errorSummary.append("url=").append(endpoint)
                        .append(", status=").append(response.statusCode())
                        .append(", body=").append(response.body());

                // 경로 미존재만 다음 후보를 시도하고, 나머지는 즉시 실패 처리
                if (response.statusCode() != 404 && response.statusCode() != 405) {
                    throw new IllegalArgumentException("Agent API 호출 실패: " + errorSummary);
                }
            }

            throw new IllegalArgumentException("Agent API 호출 실패: " + errorSummary);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalArgumentException("Agent API 통신 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private List<EndpointAttempt> buildAttempts(OrchestrateCommandRequest request) {
        String base = trimTrailingSlash(properties.getEndpoint());
        String endpointPath = normalizePath(properties.getEndpointPath());
        boolean projectRoot = base.contains(".services.ai.azure.com/api/projects/");
        boolean openAiRoot = base.contains(".openai.azure.com/openai/v1");

        List<EndpointAttempt> attempts = new ArrayList<>();
        if (StringUtils.hasText(endpointPath)) {
            attempts.add(new EndpointAttempt(base + endpointPath, buildChatCompletionsPayload(request)));
        } else if (projectRoot) {
            attempts.add(new EndpointAttempt(base + "/chat/completions", buildChatCompletionsPayload(request)));
            attempts.add(new EndpointAttempt(base + "/models/chat/completions", buildChatCompletionsPayload(request)));
            attempts.add(new EndpointAttempt(base + "/responses", buildResponsesPayload(request)));
        } else if (openAiRoot) {
            attempts.add(new EndpointAttempt(base + "/responses", buildResponsesPayload(request)));
            attempts.add(new EndpointAttempt(base + "/chat/completions", buildChatCompletionsPayload(request)));
        } else {
            attempts.add(new EndpointAttempt(base, buildCustomPayload(request)));
        }

        return deduplicateAttempts(attempts);
    }

    private List<EndpointAttempt> deduplicateAttempts(List<EndpointAttempt> rawAttempts) {
        Map<String, EndpointAttempt> unique = new LinkedHashMap<>();
        for (EndpointAttempt attempt : rawAttempts) {
            unique.putIfAbsent(attempt.url(), attempt);
        }
        return new ArrayList<>(unique.values());
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        return value.replaceAll("/+$", "");
    }

    private String normalizePath(String path) {
        if (!StringUtils.hasText(path)) {
            return null;
        }
        String trimmed = path.trim();
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private Map<String, Object> buildCustomPayload(OrchestrateCommandRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("stream", false);
        payload.put("messages", List.of(
                Map.of("role", "user", "content", request.text())
        ));
        payload.put("sessionId", request.sessionId());
        payload.put("context", request.context() == null ? Map.of() : request.context());
        return payload;
    }

    private Map<String, Object> buildChatCompletionsPayload(OrchestrateCommandRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("stream", false);
        payload.put("messages", List.of(
                Map.of("role", "user", "content", request.text())
        ));
        if (StringUtils.hasText(properties.getModel())) {
            payload.put("model", properties.getModel().trim());
        }
        return payload;
    }

    private Map<String, Object> buildResponsesPayload(OrchestrateCommandRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("input", request.text());
        if (StringUtils.hasText(properties.getModel())) {
            payload.put("model", properties.getModel().trim());
        }
        return payload;
    }

    private String resolveAuthHeaderName() {
        String mode = properties.getAuthMode() == null ? "none" : properties.getAuthMode().trim().toLowerCase();
        if (Objects.equals(mode, "api_key")) {
            return "api-key";
        }
        if (Objects.equals(mode, "bearer")) {
            return "Authorization";
        }
        return null;
    }

    private String resolveAuthHeaderValue() {
        String mode = properties.getAuthMode() == null ? "none" : properties.getAuthMode().trim().toLowerCase();
        if (Objects.equals(mode, "none")) {
            return null;
        }
        if (Objects.equals(mode, "api_key")) {
            if (!StringUtils.hasText(properties.getApiKey())) {
                throw new IllegalArgumentException("AI_AGENT_API_KEY(ai.agent.api-key) 설정이 필요합니다.");
            }
            return properties.getApiKey().trim();
        }
        if (Objects.equals(mode, "bearer")) {
            if (!StringUtils.hasText(properties.getBearerToken())) {
                throw new IllegalArgumentException("AI_AGENT_BEARER_TOKEN(ai.agent.bearer-token) 설정이 필요합니다.");
            }
            return "Bearer " + properties.getBearerToken().trim();
        }
        throw new IllegalArgumentException("지원하지 않는 ai.agent.auth-mode 입니다: " + properties.getAuthMode());
    }

    private String withApiVersion(String endpoint, String apiVersion) {
        if (!StringUtils.hasText(apiVersion) || endpoint.contains("api-version=")) {
            return endpoint;
        }
        return endpoint + (endpoint.contains("?") ? "&" : "?")
                + "api-version=" + URLEncoder.encode(apiVersion, StandardCharsets.UTF_8);
    }

    private Map<String, Object> parseJson(String json) throws IOException {
        if (!StringUtils.hasText(json)) {
            return new HashMap<>();
        }
        return objectMapper.readValue(json, MAP_TYPE);
    }

    private String extractReply(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            return "응답이 비어 있습니다.";
        }
        String[] topLevelKeys = {"reply", "outputText", "message", "result", "output_text"};
        for (String key : topLevelKeys) {
            String value = asString(raw.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        Object choices = raw.get("choices");
        if (choices instanceof java.util.List<?> choiceList && !choiceList.isEmpty()) {
            Object firstChoice = choiceList.get(0);
            if (firstChoice instanceof Map<?, ?> firstChoiceMap) {
                Object message = firstChoiceMap.get("message");
                if (message instanceof Map<?, ?> messageMap) {
                    String content = asString(messageMap.get("content"));
                    if (StringUtils.hasText(content)) {
                        return content;
                    }
                }
            }
        }

        Object output = raw.get("output");
        if (output instanceof java.util.List<?> outputList) {
            for (Object item : outputList) {
                if (item instanceof Map<?, ?> itemMap) {
                    Object content = itemMap.get("content");
                    if (content instanceof java.util.List<?> contentList) {
                        for (Object c : contentList) {
                            if (c instanceof Map<?, ?> contentMap) {
                                String text = asString(contentMap.get("text"));
                                if (StringUtils.hasText(text)) {
                                    return text;
                                }
                            }
                        }
                    }
                }
            }
        }
        return "응답은 받았지만 표시 가능한 텍스트를 찾지 못했습니다.";
    }

    private String extractIntent(Map<String, Object> raw) {
        String[] keys = {"intent", "operation", "actionType"};
        for (String key : keys) {
            String value = asString(raw.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return INTENT_FALLBACK;
    }

    private String extractErrorCode(Map<String, Object> raw) {
        String[] keys = {"errorCode", "error_code", "code"};
        for (String key : keys) {
            String value = asString(raw.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean extractRequiresConfirm(Map<String, Object> raw) {
        Object value = raw.get("requiresConfirm");
        return value instanceof Boolean bool && bool;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractMap(Map<String, Object> raw, String key) {
        Object value = raw.get(key);
        if (value instanceof Map<?, ?> mapValue) {
            return (Map<String, Object>) mapValue;
        }
        return new LinkedHashMap<>();
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private OrchestrateCommandResponse buildMockResponse(OrchestrateCommandRequest request) {
        String text = request.text() == null ? "" : request.text().trim();
        String intent = resolveMockIntent(text);

        Map<String, Object> slots = new LinkedHashMap<>();
        Map<String, Object> action = new LinkedHashMap<>();
        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> raw = new LinkedHashMap<>();

        String reply;
        boolean requiresConfirm = false;

        if ("reserve_facility".equals(intent)) {
            slots.put("facilityName", "fitness");
            action.put("name", "reservation.create");
            action.put("status", "planned");
            result.put("reservationStatus", "pending");
            requiresConfirm = true;
            reply = "Mock response: reservation intent recognized. Confirmation is required.";
        } else if ("search_room".equals(intent)) {
            slots.put("region", "seoul");
            action.put("name", "room.search");
            action.put("status", "completed");
            result.put("count", 3);
            reply = "Mock response: found 3 matching rooms.";
        } else if ("navigate_page".equals(intent)) {
            slots.put("targetPath", "/rooms");
            action.put("name", "ui.navigate");
            action.put("status", "completed");
            result.put("targetPath", "/rooms");
            reply = "Mock response: navigation intent recognized.";
        } else {
            action.put("name", "none");
            action.put("status", "skipped");
            reply = "Mock response: no executable intent detected. Please provide more detail.";
        }

        raw.put("mock", true);
        raw.put("intent", intent);
        raw.put("inputText", text);

        return new OrchestrateCommandResponse(
                SCHEMA_VERSION,
                reply,
                intent,
                slots,
                action,
                result,
                null,
                requiresConfirm,
                request.sessionId(),
                request.clientRequestId(),
                raw
        );
    }

    private String resolveMockIntent(String text) {
        String lower = text == null ? "" : text.toLowerCase();
        if (lower.contains("reserve") || lower.contains("예약")) {
            return "reserve_facility";
        }
        if (lower.contains("room") || lower.contains("매물") || lower.contains("방")) {
            return "search_room";
        }
        if (lower.contains("navigate") || lower.contains("이동") || lower.contains("page")) {
            return "navigate_page";
        }
        return INTENT_FALLBACK;
    }

    private record EndpointAttempt(String url, Map<String, Object> payload) {
    }
}
