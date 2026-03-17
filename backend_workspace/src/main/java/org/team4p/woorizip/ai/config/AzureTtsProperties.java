package org.team4p.woorizip.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai.azure-tts")
public class AzureTtsProperties {

    private boolean enabled = false;
    private String endpoint;
    private String region;
    private String apiKey;
    private String voiceName = "ko-KR-SunHiNeural";
    private String outputFormat = "audio-24khz-48kbitrate-mono-mp3";
    private int timeoutMs = 15000;
}

