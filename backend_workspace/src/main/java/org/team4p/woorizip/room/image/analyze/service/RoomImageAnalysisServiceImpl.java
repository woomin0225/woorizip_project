package org.team4p.woorizip.room.image.analyze.service;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.room.image.analyze.jpa.entity.RoomImageAnalysisEntity;
import org.team4p.woorizip.room.image.analyze.jpa.repository.RoomImageAnalysisRepository;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class RoomImageAnalysisServiceImpl implements RoomImageAnalysisService {
	private final RoomImageAnalysisRepository roomImageAnalysisRepository;
	private final UploadProperties uploadProperties;
	private final ObjectMapper objectMapper;
	
	@Value("${ai.server.base-url:http://localhost:8000}")
	private String aiServerBaseUrl;
	
	@Value("${ai.server.internal-api-key:}")
	private String internalApiKey;
	
	private final RestTemplate restTemplate = new RestTemplate();
	private final RoomImageEmbeddingService roomImageEmbeddingService;
	private final RoomImageVectorStoreService roomImageVectorStoreService;
	
	@Override
	@Transactional
	public void analyzeAndSave(RoomImageEntity roomImageEntity) {
		if(roomImageEntity == null || roomImageEntity.getRoomImageNo() == null) return;
		
		// 이미지 1장당 분석 1건
		if(roomImageAnalysisRepository.existsByRoomImageNo(roomImageEntity.getRoomImageNo())) {
			return;
		}
		
		try {
			File imageFile = new File(
					uploadProperties.roomImageDir().toFile(),
					roomImageEntity.getRoomStoredImageName()
					);
			
			if(!imageFile.exists()) return;
			
			byte[] imageBytes = Files.readAllBytes(imageFile.toPath());
			
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.MULTIPART_FORM_DATA);
			headers.set("X-API-KEY", internalApiKey);
			
			MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
			body.add("images", new ByteArrayResource(imageBytes) {
				@Override
				public String getFilename() {
					return roomImageEntity.getRoomStoredImageName();
				}
			});
			body.add("source_prefix", "room-image");
			body.add("save_embedding", "false");
			
			HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
			
			ResponseEntity<String> response = restTemplate.exchange(
					aiServerBaseUrl + "/ai/vision/room/analyze",
					HttpMethod.POST,
					requestEntity,
					String.class
			);
			
			if(!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
				return;
			}
			
			Map<String, Object> root = objectMapper.readValue(
					response.getBody(),
					new TypeReference<Map<String, Object>>() {}
			);
			
			Object dataObj = root.get("data");
			if(!(dataObj instanceof Map<?, ?> dataMapRaw)) return;
			
			@SuppressWarnings("unchecked")
			Map<String, Object> data = (Map<String, Object>) dataMapRaw;
			
			String summary = valueAsString(data.get("summary"));
			String caption = valueAsString(data.get("caption"));
			String normalizedOptions = joinList(data.get("normalized_options"));
			String ocrText = joinList(data.get("ocr_texts"));
			String rawJson = response.getBody();
			
			RoomImageAnalysisEntity entity = RoomImageAnalysisEntity.builder()
					.roomNo(roomImageEntity.getRoomNo())
					.roomImageNo(roomImageEntity.getRoomImageNo())
					.summary(summary)
					.caption(caption)
					.ocrText(ocrText)
					.normalizedOptions(normalizedOptions)
					.rawJson(rawJson)
					.build();
			
			RoomImageAnalysisEntity savedEntity = roomImageAnalysisRepository.save(entity);
			
			String embeddingText = buildEmbeddingText(savedEntity);
			log.info("embedding text built. roomImageNo={}, text={}", savedEntity.getRoomImageNo(), embeddingText);

			List<Float> embedding = roomImageEmbeddingService.createEmbedding(embeddingText);
			log.info("embedding created. roomImageNo={}, dimension={}", savedEntity.getRoomImageNo(), embedding.size());
			
			roomImageVectorStoreService.saveEmbedding(savedEntity, embeddingText, embedding);
			
		} catch (Exception e) {
			log.error("room image analysis pipeline failed. roomImageNo={}, roomNo={}",
					roomImageEntity.getRoomImageNo(),
					roomImageEntity.getRoomNo(),
					e);
		}
	}

	private String joinList(Object value) {
		if(!(value instanceof Iterable<?> iterable)) return null;
		
		StringBuilder sb = new StringBuilder();
		for(Object item : iterable) {
			if(item == null) continue;
			if(sb.length() > 0) sb.append(",");
			sb.append(item);
		}
		return sb.toString();
	}

	private String valueAsString(Object value) {
		return value == null ? null : String.valueOf(value);
	}
	
	@Override
	public String buildEmbeddingText(RoomImageAnalysisEntity entity) {
		if(entity == null) return "";
		
		StringBuilder sb = new StringBuilder();
		sb.append("방 이미지 분석 결과\n");
		
		if(hasText(entity.getRoomNo())) {
			sb.append("방 번호: ").append(entity.getRoomNo()).append("\n");
		}
		
		if (entity.getRoomImageNo() != null) {
	        sb.append("방 이미지 번호: ").append(entity.getRoomImageNo()).append("\n");
	    }

	    if (hasText(entity.getSummary())) {
	        sb.append("요약: ").append(entity.getSummary()).append("\n");
	    }

	    if (hasText(entity.getCaption())) {
	        sb.append("캡션: ").append(entity.getCaption()).append("\n");
	    }

	    if (hasText(entity.getNormalizedOptions())) {
	        sb.append("옵션: ").append(entity.getNormalizedOptions()).append("\n");
	    }

	    if (hasText(entity.getOcrText())) {
	        sb.append("OCR: ").append(entity.getOcrText()).append("\n");
	    }
	    
	    return sb.toString().trim();
	}

	private boolean hasText(String value) {
		return value != null && !value.isBlank();
	}

	@Override
	@Transactional
	public void deleteAnalyzedOne(int roomImageNo) {
		
		roomImageAnalysisRepository.deleteByRoomImageNo(roomImageNo);
		
	}
}
