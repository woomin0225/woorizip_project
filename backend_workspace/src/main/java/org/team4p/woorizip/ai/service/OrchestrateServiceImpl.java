package org.team4p.woorizip.ai.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpRequest.BodyPublishers;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.config.OrchestrateProperties;
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

    private final OrchestrateProperties properties;
    private final ObjectMapper objectMapper;
    
    private volatile String cachedIamToken;
    private volatile Instant cachedIamTokenExpiry;

    @Override
    public OrchestrateCommandResponse execute(OrchestrateCommandRequest request) {
        if (properties.isMockEnabled()) {
            return buildMockResponse(request);
        }

        if (!StringUtils.hasText(properties.getCommandUrl())) {
            throw new IllegalArgumentException("ORCHESTRATE_COMMAND_URL(ai.orchestrate.command-url)이 설정되지 않았습니다.");
        }

        try {
            String commandUrl = resolveCommandUrl(properties.getCommandUrl());

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                    .build();

            Map<String, Object> payload = buildPayload(request, commandUrl);
            String requestJson = objectMapper.writeValueAsString(payload);

            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(commandUrl))
                    .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .POST(BodyPublishers.ofString(requestJson, StandardCharsets.UTF_8));
            if (StringUtils.hasText(request.sessionId()) && commandUrl.toLowerCase().contains("/chat/completions")) {
                builder.header("X-IBM-THREAD-ID", request.sessionId().trim());
            }

            String authHeaderValue = resolveAuthorizationHeader(client);
            if (StringUtils.hasText(authHeaderValue)) {
                builder.header("Authorization", authHeaderValue);
            }

            HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalArgumentException("Orchestrate API 호출 실패: url=" + commandUrl + ", status=" + response.statusCode() + ", body=" + response.body());
            }

            Map<String, Object> raw = parseJson(response.body());
            String reply = extractReply(raw);
            String intent = extractIntent(raw);
            Map<String, Object> slots = extractMap(raw, "slots");
            Map<String, Object> action = extractMap(raw, "action");
            Map<String, Object> result = extractMap(raw, "result");
            String errorCode = extractErrorCode(raw);
            boolean requiresConfirm = extractRequiresConfirm(raw);

            return new OrchestrateCommandResponse(
                    SCHEMA_VERSION,
                    reply,
                    intent,
                    slots,
                    action,
                    result,
                    errorCode,
                    requiresConfirm,
                    request.sessionId(),
                    request.clientRequestId(),
                    raw
            );
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalArgumentException("Orchestrate API 통신 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private Map<String, Object> buildPayload(OrchestrateCommandRequest request, String resolvedCommandUrl) {
        String commandUrl = resolvedCommandUrl == null ? "" : resolvedCommandUrl.toLowerCase();

        if (commandUrl.contains("/chat/completions")) {
            Map<String, Object> userMessage = new LinkedHashMap<>();
            userMessage.put("role", "user");
            Map<String, Object> contentItem = new LinkedHashMap<>();
            contentItem.put("response_type", "text");
            contentItem.put("text", request.text());
            userMessage.put("content", java.util.List.of(contentItem));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("stream", false);
            payload.put("messages", java.util.List.of(userMessage));
            payload.put("context", request.context() == null ? Map.of() : request.context());
            return payload;
        }

        if (commandUrl.contains("/orchestrate/runs")) {
            Map<String, Object> message = new LinkedHashMap<>();
            message.put("role", "user");
            Map<String, Object> contentItem = new LinkedHashMap<>();
            contentItem.put("response_type", "text");
            contentItem.put("text", request.text());
            message.put("content", java.util.List.of(contentItem));

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("message", message);
            if (StringUtils.hasText(request.sessionId())) {
                payload.put("thread_id", request.sessionId().trim());
            }
            payload.put("context", request.context() == null ? Map.of() : request.context());
            return payload;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("text", request.text());
        payload.put("sessionId", request.sessionId());
        payload.put("context", request.context() == null ? Map.of() : request.context());
        return payload;
    }

    private String resolveAuthorizationHeader(HttpClient client) throws IOException, InterruptedException {
        String mode = properties.getAuthMode() == null ? "none" : properties.getAuthMode().trim().toLowerCase();

        if (Objects.equals(mode, "none")) {
            return null;
        }

        if (Objects.equals(mode, "bearer")) {
            if (!StringUtils.hasText(properties.getBearerToken())) {
                throw new IllegalArgumentException("auth-mode=bearer 인 경우 ORCHESTRATE_BEARER_TOKEN이 필요합니다.");
            }
            return "Bearer " + properties.getBearerToken().trim();
        }

        if (Objects.equals(mode, "iam_apikey")) {
            String token = getOrRefreshIamToken(client);
            return "Bearer " + token;
        }

        throw new IllegalArgumentException("지원하지 않는 ai.orchestrate.auth-mode 입니다: " + properties.getAuthMode());
    }

    private synchronized String getOrRefreshIamToken(HttpClient client) throws IOException, InterruptedException {
        Instant now = Instant.now();
        if (StringUtils.hasText(cachedIamToken) && cachedIamTokenExpiry != null && now.isBefore(cachedIamTokenExpiry.minusSeconds(60))) {
            return cachedIamToken;
        }

        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new IllegalArgumentException("auth-mode=iam_apikey 인 경우 ORCHESTRATE_API_KEY가 필요합니다.");
        }

        String form = "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=" + properties.getApiKey();
        HttpRequest tokenRequest = HttpRequest.newBuilder(URI.create(properties.getIamUrl()))
                .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .POST(BodyPublishers.ofString(form, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> tokenResponse = client.send(tokenRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (tokenResponse.statusCode() < 200 || tokenResponse.statusCode() >= 300) {
            throw new IllegalArgumentException("IAM 토큰 발급 실패: status=" + tokenResponse.statusCode() + ", body=" + tokenResponse.body());
        }

        Map<String, Object> tokenBody = parseJson(tokenResponse.body());
        String accessToken = asString(tokenBody.get("access_token"));
        if (!StringUtils.hasText(accessToken)) {
            throw new IllegalArgumentException("IAM 토큰 응답에 access_token이 없습니다.");
        }

        long expirationEpochSec = asLong(tokenBody.get("expiration"), 0L);
        cachedIamToken = accessToken;
        cachedIamTokenExpiry = expirationEpochSec > 0 ? Instant.ofEpochSecond(expirationEpochSec) : Instant.now().plusSeconds(3000);

        return cachedIamToken;
    }

    private Map<String, Object> parseJson(String json) throws IOException {
        if (!StringUtils.hasText(json)) {
            return new HashMap<>();
        }
        return objectMapper.readValue(json, MAP_TYPE);
    }

    private String extractReply(Map<String, Object> raw) {
        if (raw == null || raw.isEmpty()) {
            return "Orchestrate 응답이 비어 있습니다.";
        }

        String[] topLevelKeys = {"reply", "outputText", "message", "result"};
        for (String key : topLevelKeys) {
            String value = asString(raw.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }

        Object data = raw.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            String[] nestedKeys = {"reply", "outputText", "message", "result"};
            for (String key : nestedKeys) {
                String value = asString(dataMap.get(key));
                if (StringUtils.hasText(value)) {
                    return value;
                }
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
                Object delta = firstChoiceMap.get("delta");
                if (delta instanceof Map<?, ?> deltaMap) {
                    String content = asString(deltaMap.get("content"));
                    if (StringUtils.hasText(content)) {
                        return content;
                    }
                }
            }
        }

        String runId = asString(raw.get("run_id"));
        if (StringUtils.hasText(runId)) {
            return "요청이 접수되었습니다. run_id=" + runId;
        }

        return "응답은 받았지만 표시 가능한 텍스트 필드(reply/outputText/message/result)를 찾지 못했습니다.";
    }

    private String extractIntent(Map<String, Object> raw) {
        String[] keys = {"intent", "operation", "actionType"};
        for (String key : keys) {
            String value = asString(raw.get(key));
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        Object data = raw.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            for (String key : keys) {
                String value = asString(dataMap.get(key));
                if (StringUtils.hasText(value)) {
                    return value;
                }
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
        Object data = raw.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            for (String key : keys) {
                String value = asString(dataMap.get(key));
                if (StringUtils.hasText(value)) {
                    return value;
                }
            }
        }
        return null;
    }

    private boolean extractRequiresConfirm(Map<String, Object> raw) {
        Object value = raw.get("requiresConfirm");
        if (value instanceof Boolean bool) {
            return bool;
        }
        Object data = raw.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            Object nested = dataMap.get("requiresConfirm");
            if (nested instanceof Boolean bool) {
                return bool;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractMap(Map<String, Object> raw, String key) {
        Object value = raw.get(key);
        if (value instanceof Map<?, ?> mapValue) {
            return (Map<String, Object>) mapValue;
        }
        Object data = raw.get("data");
        if (data instanceof Map<?, ?> dataMap) {
            Object nested = dataMap.get(key);
            if (nested instanceof Map<?, ?> nestedMap) {
                return (Map<String, Object>) nestedMap;
            }
        }
        return new LinkedHashMap<>();
    }

    private String resolveCommandUrl(String rawUrl) {
        String url = rawUrl == null ? "" : rawUrl.trim();
        if (!StringUtils.hasText(url)) {
            return url;
        }

        String lower = url.toLowerCase();
        if (lower.contains("/api/v1/") || lower.contains("/chat/completions")) {
            return url;
        }

        if (lower.matches(".*/instances/[^/]+/?$")) {
            String base = url.replaceAll("/+$", "");

            if (StringUtils.hasText(properties.getAgentId())) {
                return base + "/api/v1/orchestrate/" + properties.getAgentId().trim() + "/chat/completions";
            }
            if (StringUtils.hasText(properties.getAssistantId())) {
                return base + "/api/v1/assistants/" + properties.getAssistantId().trim() + "/runs";
            }
            return base + "/api/v1/orchestrate/runs";
        }

        return url;
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
            slots.put("facilityName", "헬스장");
            action.put("name", "reservation.create");
            action.put("status", "planned");
            result.put("reservationStatus", "pending");
            requiresConfirm = true;
            reply = "모의 응답입니다. 공용시설 예약 요청을 인식했습니다. 예약 확정 전 확인이 필요합니다.";
        } else if ("search_room".equals(intent)) {
            slots.put("region", "서울");
            action.put("name", "room.search");
            action.put("status", "completed");
            result.put("count", 3);
            result.put("items", java.util.List.of(
                    Map.of("roomNo", "R1001", "title", "역세권 원룸"),
                    Map.of("roomNo", "R1002", "title", "채광 좋은 투룸"),
                    Map.of("roomNo", "R1003", "title", "풀옵션 원룸")
            ));
            reply = "모의 응답입니다. 조건에 맞는 방 3개를 찾았습니다.";
        } else if ("navigate_page".equals(intent)) {
            slots.put("targetPath", "/rooms");
            action.put("name", "ui.navigate");
            action.put("status", "completed");
            result.put("targetPath", "/rooms");
            reply = "모의 응답입니다. 방 찾기 페이지로 이동하는 명령을 인식했습니다.";
        } else {
            action.put("name", "none");
            action.put("status", "skipped");
            reply = "모의 응답입니다. 아직 처리할 수 없는 요청이라 추가 정보를 알려주세요.";
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
        if (lower.contains("예약")) {
            return "reserve_facility";
        }
        if (lower.contains("방") || lower.contains("매물") || lower.contains("찾아")) {
            return "search_room";
        }
        if (lower.contains("이동") || lower.contains("페이지")) {
            return "navigate_page";
        }
        return INTENT_FALLBACK;
    }

    private long asLong(Object value, long defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ignored) {
            return defaultValue;
        }
    }

}
