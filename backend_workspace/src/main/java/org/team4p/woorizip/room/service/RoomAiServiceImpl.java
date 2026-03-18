package org.team4p.woorizip.room.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
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
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.room.dto.ai.EmbedResponse;
import org.team4p.woorizip.room.dto.ai.RoomTotalRequest;
import org.team4p.woorizip.room.dto.ai.RoomTotalResponse;
import org.team4p.woorizip.room.dto.response.RoomAiAnalyzeResponse;
import org.team4p.woorizip.room.image.service.RoomImageSummaryService;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomEmbeddingRepository;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.review.service.ReviewSummaryService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomAiServiceImpl implements RoomAiService {

    private final RoomRepository roomRepository;
    private final HouseRepository houseRepository;
    private final ReviewSummaryService reviewSummaryService;
    private final RoomImageSummaryService roomImageSummaryService;
    private final RoomEmbeddingRepository roomEmbeddingRepository;

	private final ObjectMapper objectMapper;
	
	@Value("${ai.server.base-url:http://localhost:8000}")
	private String aiServerBaseUrl;
	
	@Value("${ai.server.internal-api-key:}")
	private String internalApiKey;
	
	private final RestTemplate restTemplate = new RestTemplate();
	private final WebClient.Builder webClientBuilder;

    
	
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

	@Override
	public String selectSummarizedRoom(String roomNo) {
		// AI 서버에서 종합요약 엔드포인트 호출
		WebClient webClient = webClientBuilder.build();
		RoomTotalResponse response = null;
		
		RoomTotalRequest request = buildRoomTotalRequest(roomNo);
		
		try {
			Mono<RoomTotalResponse> monoResponse = webClient.post()
					.uri(aiServerBaseUrl.concat("/ai/summary/room/total"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(RoomTotalResponse.class)
					;
			response = monoResponse.block();
		} catch (Exception e) {
			
		}
		String result = response.getSummary();
		return result;
	}

	@Override
	public EmbedResponse embedRoom(String roomNo) {
		// AI 서버에서 종합요약 엔드포인트 호출
		WebClient webClient = webClientBuilder.build();
		EmbedResponse response = null;
		
		RoomTotalRequest request = buildRoomTotalRequest(roomNo);
		
		try {
			EmbedResponse deleteResult = deleteEmbeededRoomVector(roomNo);
			log.info("방번호("+roomNo+"): 기존 벡터 제거 완료");
			Mono<EmbedResponse> monoResponse = webClient.post()
					.uri(aiServerBaseUrl.concat("/ai/embed/room"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(EmbedResponse.class)
					;
			response = monoResponse.block();
			log.info("방번호("+roomNo+"): 새 백터 생성 및 저장 완료");
		} catch (Exception e) {
			log.info("방번호("+roomNo+"): 벡터 업데이트 과정 중 오류 발생");
		}
		return response;
	}
	
	private RoomTotalRequest buildRoomTotalRequest(String roomNo){
		RoomEntity room = roomRepository.findById(roomNo).get();
		HouseEntity house = houseRepository.findByroomNo(roomNo).get();
		String reviewSummary = reviewSummaryService.selectSummarizedReview(roomNo).getReviewSummary();
		String roomImageSummary = roomImageSummaryService.selectSummarizedImageCaption(roomNo).getImageSummary();
		
		RoomTotalRequest request = RoomTotalRequest.builder()
				.roomNo(roomNo)
				.roomName(room.getRoomName())
				.houseNo(house.getHouseNo())
				.houseName(house.getHouseName())
				.houseAddress(house.getHouseAddress())
				.houseCompletionYear(house.getHouseCompletionYear())
				.houseFloor(house.getHouseFloors())
				.houseHouseHolds(house.getHouseHouseHolds())
				.houseElevatorYn(house.getHouseElevatorYn())
				.housePetYn(house.getHousePetYn())
				.houseFemaleLimit(house.getHouseFemaleLimit())
				.houseParkingMax(house.getHouseParkingMax())
				.houseAbstract(house.getHouseAbstract())
				.roomCreatedAt(room.getRoomCreatedAt())
				.roomUpdatedAt(room.getRoomUpdatedAt())
				.roomDeposit(room.getRoomDeposit())
				.roomMonthly(room.getRoomMonthly())
				.roomMethod(room.getRoomMethod())
				.roomArea(room.getRoomArea())
				.roomFacing(room.getRoomFacing())
				.roomAvailableDate(room.getRoomAvailableDate())
				.roomAbstract(room.getRoomAbstract())
				.roomRoomCount(room.getRoomRoomCount())
				.roomBathCount(room.getRoomBathCount())
				.roomEmptyYn(room.getRoomEmptyYn())
				.roomStatus(room.getRoomStatus())
				.roomOptions(room.getRoomOptions())
				.imageSummary(roomImageSummary)
				.reviewSummary(reviewSummary)
				.build();
		
		return request;
	}

	@Override
	public List<RoomEmbeddingEntity> findEmbeddingPendingRooms() {

		List<RoomEmbeddingEntity> list = roomEmbeddingRepository.findAllByEmbeddingStatus("PENDING");
		return list;
	}

	@Override
	public EmbedResponse deleteEmbeededRoomVector(String roomNo) {
		WebClient webClient = webClientBuilder.build();
		EmbedResponse response = null;
		try {
			Mono<EmbedResponse> monoResponse = webClient.post()
					.uri(aiServerBaseUrl+"/ai/embed/room", roomNo)
					.retrieve()
					.bodyToMono(EmbedResponse.class)
					;
			response = monoResponse.block();
		} catch (Exception e) {
			
		}

		return response;
	}

}
