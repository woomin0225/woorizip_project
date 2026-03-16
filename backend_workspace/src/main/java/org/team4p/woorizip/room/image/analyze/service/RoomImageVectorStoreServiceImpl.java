package org.team4p.woorizip.room.image.analyze.service;

import java.util.HashMap;
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
import org.team4p.woorizip.room.image.analyze.jpa.entity.RoomImageAnalysisEntity;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class RoomImageVectorStoreServiceImpl implements RoomImageVectorStoreService {
	
	@Value("${qdrant.base-url}")
	private String qdrantBaseUrl;
	
	@Value("${qdrant.collection-name}")
	private String qdrantCollectionName;
	
	@Value("${qdrant.api-key:}")
	private String qdrantApiKey;
	
	private final RestTemplate restTemplate = new RestTemplate();

	@Override
	public void saveEmbedding(RoomImageAnalysisEntity entity, String embeddingText, List<Float> embedding) {
		if(entity == null || embedding == null || embedding.isEmpty()) {
			return;
		}
		
		Map<String, Object> payload = new HashMap<>();
		payload.put("analysisNo", entity.getAnalysisNo());
		payload.put("roomNo", entity.getRoomNo());
		payload.put("roomImageNo", entity.getRoomImageNo());
		payload.put("summary", entity.getSummary());
		payload.put("caption", entity.getCaption());
		payload.put("ocrText", entity.getOcrText());
		payload.put("normalizedOptions", entity.getNormalizedOptions());
		payload.put("embeddingText", embeddingText);
		payload.put("type", "room_image_analysis");
		
		Map<String, Object> point = new HashMap<>();
		point.put("id", entity.getAnalysisNo());
		point.put("vector", embedding);
		point.put("payload", payload);
		
		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("points", List.of(point));
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		
		if(qdrantApiKey != null && !qdrantApiKey.isBlank()) {
			headers.set("api-key", qdrantApiKey);
		}
		
		HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
		
		String url = qdrantBaseUrl + "/collections/" + qdrantCollectionName + "/points/";
		
		ResponseEntity<String> response = restTemplate.exchange(
				url,
				HttpMethod.PUT,
				requestEntity,
				String.class
		);
		
		log.info(
				"qdrant save success. analysisNo={}, roomImageNo={}, status={}",
				entity.getAnalysisNo(),
				entity.getRoomImageNo(),
				response.getStatusCode()
		);
	}
}
