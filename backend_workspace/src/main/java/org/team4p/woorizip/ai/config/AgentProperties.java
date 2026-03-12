package org.team4p.woorizip.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai.agent")
public class AgentProperties {

    private boolean mockEnabled = false;
    private String endpoint;
    private String endpointPath;
    private String model;
    private String systemPrompt;
    private String baseInfo;
    private int timeoutMs = 15000;

    // api_key | bearer | none
    private String authMode = "api_key";
    private String apiKey;
    private String bearerToken;

    // Optional query parameter for endpoints that require api-version.
    private String apiVersion;
}
