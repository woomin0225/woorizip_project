package org.team4p.woorizip.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai.orchestrate")
public class OrchestrateProperties {

    private boolean mockEnabled = false;
    private String commandUrl;
    private int timeoutMs = 15000;
    private String authMode = "iam_apikey";

    private String bearerToken;
    private String apiKey;
    private String iamUrl = "https://iam.cloud.ibm.com/identity/token";
    private String assistantId;
    private String agentId;
}
