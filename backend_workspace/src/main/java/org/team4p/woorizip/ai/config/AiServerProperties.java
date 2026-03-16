package org.team4p.woorizip.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai.server")
public class AiServerProperties {

    private String baseUrl = "http://localhost:8000";
    private String internalApiKey = "local-dev-key";
    private int timeoutMs = 15000;
}
