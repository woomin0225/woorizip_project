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

	@Value("${openai.api-key}")
	private String openaiApiKey;
	
	@Value("${openai.embedding-url}")
	private String embeddingUrl;
	
	@Value("${openai.embedding-model:text-embedding-3-small")
	private String embeddingModel;
	
	private final RestTemplate restTemplate = new RestTemplate();
	
	@Override
	@SuppressWarnings("unchecked")
	public List<Float> createEmbedding(String text) {
		if(text == null || text.isBlank()) {
			throw new IllegalArgumentException("임베딩할 텍스트가 비어 있습니다.");
		}
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setBearerAuth(openaiApiKey);
		
		Map<String, Object> body = Map.of(
				"model", embeddingModel,
				"input", text
		);
		
		HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);
		
		ResponseEntity<Map> response = restTemplate.exchange(
				embeddingUrl, 
				HttpMethod.POST,
				requestEntity,
				Map.class
		);
		
		if(!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
			throw new IllegalStateException("OpenAI embedding 호출에 실패했습니다.");
		}
		
		Map<String, Object> root = response.getBody();
		Object dataObj = root.get("data");
		if(!(dataObj instanceof List<?> dataList) || dataList.isEmpty()) {
			throw new IllegalStateException("OpenAI embedding 응답에 data가 없습니다.");
		}
		
		Object firstObj = dataList.get(0);
		if(!(firstObj instanceof Map<?, ?> firstMapRaw)) {
			throw new IllegalStateException("OpenAI embedding 응답 형식이 올바르지 않습니다.");
		}
		
		Map<String, Object> firstMap = (Map<String, Object>) firstMapRaw;
		Object embeddingObj = firstMap.get("embedding");
		if(!(embeddingObj instanceof List<?> rawEmbedding)) {
			throw new IllegalStateException("OpenAI embedding 응답에 embedding이 없습니다.");
		}
		
		return rawEmbedding.stream()
				.map(value -> ((Number) value).floatValue())
				.toList();
		
	}
}












