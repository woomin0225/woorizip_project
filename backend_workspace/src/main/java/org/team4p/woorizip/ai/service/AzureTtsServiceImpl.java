package org.team4p.woorizip.ai.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpRequest.BodyPublishers;
import java.time.Duration;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.ai.config.AzureTtsProperties;
import org.team4p.woorizip.ai.dto.TtsSynthesizeRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AzureTtsServiceImpl implements AzureTtsService {

    private final AzureTtsProperties properties;

    @Override
    public byte[] synthesize(TtsSynthesizeRequest request) {
        if (!properties.isEnabled()) {
            throw new IllegalArgumentException("Azure TTS가 비활성화되어 있습니다. ai.azure-tts.enabled=true 로 설정하세요.");
        }
        if (!StringUtils.hasText(properties.getApiKey())) {
            throw new IllegalArgumentException("AZURE_TTS_API_KEY(ai.azure-tts.api-key) 설정이 필요합니다.");
        }

        String endpoint = resolveEndpoint();
        String voiceName = StringUtils.hasText(request.voiceName()) ? request.voiceName().trim() : properties.getVoiceName();
        String ssml = toSsml(request.text(), voiceName);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getTimeoutMs()))
                .build();

        HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(endpoint))
                .timeout(Duration.ofMillis(properties.getTimeoutMs()))
                .header("Ocp-Apim-Subscription-Key", properties.getApiKey())
                .header("Content-Type", "application/ssml+xml")
                .header("X-Microsoft-OutputFormat", properties.getOutputFormat())
                .header("User-Agent", "woorizip-azure-tts")
                .POST(BodyPublishers.ofString(ssml))
                .build();

        try {
            HttpResponse<byte[]> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String body = new String(response.body());
                throw new IllegalArgumentException("Azure TTS 호출 실패: status=" + response.statusCode() + ", body=" + body);
            }
            return response.body();
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalArgumentException("Azure TTS 통신 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    private String resolveEndpoint() {
        if (StringUtils.hasText(properties.getEndpoint())) {
            return properties.getEndpoint().trim();
        }
        if (!StringUtils.hasText(properties.getRegion())) {
            throw new IllegalArgumentException("AZURE_TTS_REGION(ai.azure-tts.region) 또는 AZURE_TTS_ENDPOINT 설정이 필요합니다.");
        }
        return "https://" + properties.getRegion().trim() + ".tts.speech.microsoft.com/cognitiveservices/v1";
    }

    private String toSsml(String text, String voiceName) {
        String safeText = escapeXml(text);
        return "<speak version=\"1.0\" xml:lang=\"ko-KR\">"
                + "<voice name=\"" + escapeXml(voiceName) + "\">"
                + safeText
                + "</voice>"
                + "</speak>";
    }

    private String escapeXml(String input) {
        if (input == null) {
            return "";
        }
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}

