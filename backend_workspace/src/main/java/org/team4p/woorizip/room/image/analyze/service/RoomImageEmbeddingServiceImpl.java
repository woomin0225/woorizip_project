package org.team4p.woorizip.room.image.analyze.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomImageEmbeddingServiceImpl implements RoomImageEmbeddingService {

	@Value("${ai.server.base-url:http://localhost:8000}")
    private String aiServerBaseUrl;

    @Value("${ai.server.internal-api-key:}")
    private String internalApiKey;
	
	private final RestTemplate restTemplate = new RestTemplate();
	
	@Override
	@SuppressWarnings("unchecked")
	public List<Float> createEmbedding(String text) {
		if(text == null || text.isBlank()) {
			throw new IllegalArgumentException("임베딩할 텍스트가 비어 있습니다.");
		}
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.set("X-API-KEY", internalApiKey);
		
		Map<String, Object> body = Map.of(
				"text", text
		);
		
		HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
		
		ResponseEntity<Map> response = restTemplate.exchange(
				aiServerBaseUrl + "/ai/embedding", 
				HttpMethod.POST,
				requestEntity,
				Map.class
		);
		
		if(!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
			throw new IllegalStateException("FastAPI embedding 호출에 실패했습니다.");
		}
		
		Map<String, Object> root = response.getBody();
		Object embeddingObj = root.get("embedding");
		if(!(embeddingObj instanceof List<?> rawEmbedding)) {
			throw new IllegalStateException("FastAPI embedding 응답에 embedding이 없습니다.");
		}
		
		return rawEmbedding.stream()
				.map(value -> ((Number) value).floatValue())
				.toList();
		
	}
}
