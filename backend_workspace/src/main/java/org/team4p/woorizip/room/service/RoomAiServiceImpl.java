package org.team4p.woorizip.room.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.room.dto.response.RoomAiAnalyzeResponse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomAiServiceImpl implements RoomAiService {

	private final ObjectMapper objectMapper;
	
	@Value("${ai.server.base-url:http://localhost:8000}")
	private String aiServerBaseUrl;
	
	@Value("${ai.server.internal-api-key:}")
	private String internalApiKey;
	
	private final RestTemplate restTemplate = new RestTemplate();
	
	@Override
	public RoomAiAnalyzeResponse analyzeRoomImages(List<MultipartFile> images) {
		if(images == null || images.isEmpty()) {
			throw new IllegalArgumentException("분석할 이미지가 없습니다.");
		}
		
		try {
			String url = aiServerBaseUrl + "/ai/vision/room/analyze";
			
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.MULTIPART_FORM_DATA);
			
			if(internalApiKey != null && !internalApiKey.isBlank()) {
				headers.set("X-API-Key", internalApiKey);
			}
			
			MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
			
			for(MultipartFile image : images) {
				body.add("images", toByteArrayResource(image));
			}
			
			HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
			
			ResponseEntity<String> response = restTemplate.exchange(
					url,
					HttpMethod.POST,
					requestEntity,
					String.class
					);
			
			if(!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
				throw new RuntimeException("AI 서버 응답이 비정상입니다.");
			}
			
			return parseResponse(response.getBody());
			
		} catch (Exception e) {
			throw new RuntimeException("방 이미지 AI 분석 중 오류가 발생했습니다: " + e.getMessage(), e);
		}
	}

	private RoomAiAnalyzeResponse parseResponse(String responseBody) throws Exception {
		JsonNode root = objectMapper.readTree(responseBody);
		JsonNode data = root.path("data");
		
		return RoomAiAnalyzeResponse.builder()
				.summary(getText(data, "summary"))
				.caption(getText(data, "caption"))
				.ocrTexts(toStringList(data.path("ocr_texts")))
				.detectedObjects(toStringList(data.path("detected_objects")))
				.optionCandidates(toOptionCandidates(data.path("option_candidates")))
				.normalizedOptions(toStringList(data.path("normalized_options")))
				.warnings(toStringList(data.path("warnings")))
				.meta(toMap(data.path("meta")))
				.build();
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> toMap(JsonNode node) {
		if(node == null || node.isMissingNode() || node.isNull()) {
			return Collections.emptyMap();
		}
		return objectMapper.convertValue(node, Map.class);
	}

	private List<RoomAiAnalyzeResponse.OptionCandidate> toOptionCandidates(JsonNode node) {
		if(node == null || !node.isArray()) {
			return Collections.emptyList();
		}
		
		List<RoomAiAnalyzeResponse.OptionCandidate> result = new ArrayList<>();
		for(JsonNode item : node) {
			result.add(RoomAiAnalyzeResponse.OptionCandidate.builder()
					.name(item.path("name").asText(""))
					.confidence(item.path("confidence").asDouble(0.0))
					.source(item.path("source").asText(""))
					.build());
		}
		return result;
	}

	private List<String> toStringList(JsonNode node) {
		if(node == null || !node.isArray()) {
			return Collections.emptyList();
		}
		
		List<String> result = new ArrayList<>();
		for(JsonNode item : node) {
			result.add(item.asText(""));
		}
		return result;
	}

	private String getText(JsonNode node, String fieldName) {
		JsonNode value = node.path(fieldName);
		return value.isMissingNode() || value.isNull() ? "" : value.asText("");
	}

	private ByteArrayResource toByteArrayResource(MultipartFile file) throws IOException {
		return  new ByteArrayResource(file.getBytes()) {
			@Override
			public String getFilename() {
				return file.getOriginalFilename();
			}
		};
	}
}
