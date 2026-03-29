package org.team4p.woorizip.ai.service;

import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.config.AiServerProperties;

import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiServerClient {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final AiServerProperties properties;
    private final ObjectMapper objectMapper;

    public Map<String, Object> post(String path, Object payload) {
        return post(path, payload, Collections.emptyMap());
    }

    public Map<String, Object> post(String path, Object payload, Map<String, String> extraHeaders) {
        String baseUrl = trimTrailingSlash(properties.getBaseUrl());
        if (!StringUtils.hasText(baseUrl)) {
            throw new IllegalArgumentException("ai.server.base-url 설정이 필요합니다.");
        }

        String targetPath = path.startsWith("/") ? path : "/" + path;
        String targetUrl = baseUrl + targetPath;

        RequestConfig config = RequestConfig.custom()
                .setConnectTimeout(properties.getTimeoutMs())
                .setConnectionRequestTimeout(properties.getTimeoutMs())
                .setSocketTimeout(properties.getTimeoutMs())
                .build();

        try (CloseableHttpClient client = HttpClients.custom()
                .setDefaultRequestConfig(config)
                .disableAutomaticRetries()
                .build()) {
            HttpPost request = new HttpPost(targetUrl);
            request.setHeader("Content-Type", "application/json; charset=UTF-8");
            request.setHeader("Accept", "application/json");
            request.setHeader("X-API-KEY", StringUtils.hasText(properties.getInternalApiKey())
                    ? properties.getInternalApiKey().trim()
                    : "local-dev-key");
            extraHeaders.forEach(request::setHeader);

            Object requestBody = payload == null ? Collections.emptyMap() : payload;
            String json = objectMapper.writeValueAsString(requestBody);
            request.setEntity(new StringEntity(json, ContentType.APPLICATION_JSON));

            try (CloseableHttpResponse response = client.execute(request)) {
                String body = response.getEntity() == null
                        ? ""
                        : EntityUtils.toString(response.getEntity(), java.nio.charset.StandardCharsets.UTF_8);

                int statusCode = response.getStatusLine().getStatusCode();
                if (statusCode < 200 || statusCode >= 300) {
                    throw new IllegalArgumentException(
                            "AI 서버 호출 실패: status=" + statusCode + ", body=" + body
                    );
                }

                if (!StringUtils.hasText(body)) {
                    return Collections.emptyMap();
                }

                return objectMapper.readValue(body, MAP_TYPE);
            }
        } catch (IOException e) {
            String detail = StringUtils.hasText(e.getMessage())
                    ? e.getClass().getSimpleName() + ": " + e.getMessage()
                    : e.getClass().getSimpleName();
            throw new IllegalArgumentException("AI 서버 통신 중 오류가 발생했습니다: " + detail);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            String detail = StringUtils.hasText(e.getMessage())
                    ? e.getClass().getSimpleName() + ": " + e.getMessage()
                    : e.getClass().getSimpleName();
            throw new IllegalArgumentException("AI 서버 통신 중 오류가 발생했습니다: " + detail);
        }
    }

    private String trimTrailingSlash(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        return value.replaceAll("/+$", "");
    }
}
