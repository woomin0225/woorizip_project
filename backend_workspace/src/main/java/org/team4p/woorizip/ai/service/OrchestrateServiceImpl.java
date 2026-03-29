package org.team4p.woorizip.ai.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.HashMap;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.dto.OrchestrateCommandRequest;
import org.team4p.woorizip.ai.dto.OrchestrateCommandResponse;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrchestrateServiceImpl implements OrchestrateService {

    private final AiServerClient aiServerClient;
    private final UserRepository userRepository;

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
        } else if (StringUtils.hasText(request.accessToken())) {
            String token = request.accessToken().trim();
            if (!token.toLowerCase().startsWith("bearer ")) {
                token = "Bearer " + token;
            }
            extraHeaders.put("Authorization", token);
        }
        appendUserContextHeaders(extraHeaders);
        log.info(
                "ORCHESTRATE_AUTH_CONTEXT authorizationHeaderPresent={} requestAccessTokenPresent={} xUserIdPresent={} xUserNamePresent={} xUserPhonePresent={} sessionId={}",
                StringUtils.hasText(authorization),
                StringUtils.hasText(request.accessToken()),
                StringUtils.hasText(extraHeaders.get("X-User-Id")),
                StringUtils.hasText(extraHeaders.get("X-User-Name")),
                StringUtils.hasText(extraHeaders.get("X-User-Phone")),
                request.sessionId()
        );

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

    private void appendUserContextHeaders(Map<String, String> headers) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            log.warn(
                    "ORCHESTRATE_SECURITY_CONTEXT_MISSING authenticationPresent={} principalClass={} authenticated={}",
                    authentication != null,
                    authentication != null && authentication.getPrincipal() != null
                            ? authentication.getPrincipal().getClass().getName()
                            : "null",
                    authentication != null && authentication.isAuthenticated()
            );
            return;
        }

        String forwardedUserId = authentication.getName();
        if (authentication.getPrincipal() instanceof CustomUserPrincipal principal) {
            if (StringUtils.hasText(principal.getUserNo())) {
                forwardedUserId = principal.getUserNo();
            }
            if (StringUtils.hasText(principal.getName())) {
                headers.put("X-User-Name", principal.getName());
            }
            userRepository.findById(principal.getUserNo())
                    .map(UserEntity::getPhone)
                    .filter(StringUtils::hasText)
                    .ifPresent(phone -> headers.put("X-User-Phone", phone));
        }
        headers.put("X-User-Id", forwardedUserId);

        String roles = authentication.getAuthorities().stream()
                .map(grantedAuthority -> grantedAuthority.getAuthority())
                .reduce((left, right) -> left + "," + right)
                .orElse("");
        if (StringUtils.hasText(roles)) {
            headers.put("X-Roles", roles);
        }

        log.info(
                "ORCHESTRATE_SECURITY_CONTEXT_RESOLVED authName={} forwardedUserId={} principalClass={} roles={} userNamePresent={} userPhonePresent={}",
                authentication.getName(),
                headers.get("X-User-Id"),
                authentication.getPrincipal() != null ? authentication.getPrincipal().getClass().getName() : "null",
                roles,
                StringUtils.hasText(headers.get("X-User-Name")),
                StringUtils.hasText(headers.get("X-User-Phone"))
        );
    }
}
