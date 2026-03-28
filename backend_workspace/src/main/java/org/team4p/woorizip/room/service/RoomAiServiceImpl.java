package org.team4p.woorizip.room.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
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
import org.team4p.woorizip.room.image.analyze.jpa.repository.RoomImageAnalysisRepository;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;
import org.team4p.woorizip.room.image.service.RoomImageSummaryService;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.entity.RoomFinalSummaryEntity;
import org.team4p.woorizip.room.jpa.repository.RoomEmbeddingRepository;
import org.team4p.woorizip.room.jpa.repository.RoomFinalSummaryRepository;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;
import org.team4p.woorizip.room.review.jpa.repository.ReviewRepository;
import org.team4p.woorizip.room.review.service.ReviewSummaryService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomAiServiceImpl implements RoomAiService {

	private static final String STATUS_PENDING = "PENDING";
	private static final String STATUS_PROCESSING = "PROCESSING";
	private static final String STATUS_DONE = "DONE";
	private static final String STATUS_FAILED = "FAILED";
	private static final int MAX_EMBED_RETRY = 3;

    private final RoomRepository roomRepository;
    private final HouseRepository houseRepository;
    private final ReviewSummaryService reviewSummaryService;
    private final RoomImageSummaryService roomImageSummaryService;
    private final RoomEmbeddingRepository roomEmbeddingRepository;
    private final RoomFinalSummaryRepository roomFinalSummaryRepository;
    private final ReviewRepository reviewRepository;
    private final RoomImageAnalysisRepository roomImageAnalysisRepository;

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
			throw new IllegalArgumentException("No images provided for analysis.");
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
			ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, String.class);

			if(!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
				throw new RuntimeException("AI server returned an invalid response.");
			}

			return parseResponse(response.getBody());
		} catch (Exception e) {
			throw new RuntimeException("Room image AI analysis failed: " + e.getMessage(), e);
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
		return new ByteArrayResource(file.getBytes()) {
			@Override
			public String getFilename() {
				return file.getOriginalFilename();
			}
		};
	}

	@Override
	@Transactional
	public RoomFinalSummaryEntity requestSummarizedRoom(String roomNo) {
		RoomFinalSummaryEntity entity = roomFinalSummaryRepository.findById(roomNo)
				.orElseGet(() -> RoomFinalSummaryEntity.builder()
						.roomNo(roomNo)
						.summaryStatus(STATUS_PENDING)
						.retryCount(0)
						.build());

		if(isFinalSummaryFresh(entity, roomNo)) {
			return entity;
		}
		if(STATUS_PROCESSING.equals(entity.getSummaryStatus())) {
			// Keep the current worker running instead of resetting an in-flight summary back to PENDING.
			return entity;
		}

		entity.setSummaryStatus(STATUS_PENDING);
		entity.setLastErrorMessage(null);
		if(entity.getRetryCount() == null) {
			entity.setRetryCount(0);
		}
		entity.setUpdatedAt(LocalDateTime.now());
		roomFinalSummaryRepository.save(entity);
		return entity;
	}

	@Override
	@Transactional
	public RoomFinalSummaryEntity selectSummarizedRoom(String roomNo) {
		RoomFinalSummaryEntity entity = roomFinalSummaryRepository.findById(roomNo).orElse(null);
		if(entity == null) {
			return null;
		}
		if(isFinalSummaryFresh(entity, roomNo)) {
			return entity;
		}
		if(STATUS_PROCESSING.equals(entity.getSummaryStatus()) || STATUS_PENDING.equals(entity.getSummaryStatus())) {
			return entity;
		}
		entity.setSummaryStatus(STATUS_PENDING);
		entity.setLastErrorMessage(null);
		if(entity.getRetryCount() == null) {
			entity.setRetryCount(0);
		}
		entity.setUpdatedAt(LocalDateTime.now());
		roomFinalSummaryRepository.save(entity);
		return entity;
	}

	@Override
	public List<RoomFinalSummaryEntity> findSummaryPendingRooms() {
		return roomFinalSummaryRepository.findAllBySummaryStatus(STATUS_PENDING);
	}

	@Override
	public String summaryPendingRooms(String roomNo) {
		if(roomNo == null || roomNo.isBlank()) {
			throw new IllegalArgumentException("roomNo is required.");
		}

		RoomFinalSummaryEntity entity = roomFinalSummaryRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("Room final summary row not found."));
		if(!isReadyForFinalSummary(roomNo)) {
			return "Summary pending prerequisites";
		}
		if(STATUS_PROCESSING.equals(entity.getSummaryStatus())) {
			return "Summary already processing";
		}
		if(STATUS_DONE.equals(entity.getSummaryStatus()) && isFinalSummaryFresh(entity, roomNo)) {
			return defaultString(entity.getFinalSummary());
		}

		// Claim the row in a short transaction first so the long AI call does not hold the row lock.
		int claimed = roomFinalSummaryRepository.claimProcessing(roomNo, STATUS_PENDING, STATUS_PROCESSING, LocalDateTime.now());
		if(claimed == 0) {
			RoomFinalSummaryEntity current = roomFinalSummaryRepository.findById(roomNo)
					.orElseThrow(() -> new IllegalArgumentException("Room final summary row not found."));
			if(STATUS_PROCESSING.equals(current.getSummaryStatus())) {
				return "Summary already processing";
			}
			if(STATUS_DONE.equals(current.getSummaryStatus()) && isFinalSummaryFresh(current, roomNo)) {
				return defaultString(current.getFinalSummary());
			}
			return defaultString(current.getFinalSummary());
		}

		entity = roomFinalSummaryRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("Room final summary row not found."));
		WebClient webClient = webClientBuilder.build();
		RoomTotalRequest request = buildSummaryRoomTotalRequest(roomNo);

		try {
			RoomTotalResponse response = webClient.post()
					.uri(aiServerBaseUrl.concat("/ai/summary/room/total"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(RoomTotalResponse.class)
					.block();

			if(response == null) {
				throw new RuntimeException("Summary response is empty.");
			}
			entity.setFinalSummary(response.getSummary());
			entity.setSummaryStatus(STATUS_DONE);
			entity.setRetryCount(0);
			entity.setLastErrorMessage(null);
			entity.setUpdatedAt(LocalDateTime.now());
			roomFinalSummaryRepository.save(entity);
			startEmbeddingAsync(roomNo);
			return response.getSummary();
		} catch (Exception e) {
			int retryCount = entity.getRetryCount() == null ? 0 : entity.getRetryCount();
			if(retryCount >= 3) {
				entity.setSummaryStatus(STATUS_FAILED);
			} else {
				entity.setRetryCount(retryCount + 1);
				entity.setSummaryStatus(STATUS_PENDING);
			}
			entity.setLastErrorMessage(e.getMessage());
			entity.setUpdatedAt(LocalDateTime.now());
			roomFinalSummaryRepository.save(entity);
			throw new RuntimeException("Room summary request failed: " + e.getMessage(), e);
		}
	}

	@Override
	@Async("aiTaskExecutor")
	public void startSummarizedRoomAsync(String roomNo) {
		RoomFinalSummaryEntity entity = roomFinalSummaryRepository.findById(roomNo).orElse(null);
		if(entity == null) {
			return;
		}
		if(STATUS_PROCESSING.equals(entity.getSummaryStatus())) {
			return;
		}
		if(STATUS_DONE.equals(entity.getSummaryStatus()) && isFinalSummaryFresh(entity, roomNo)) {
			return;
		}

		try {
			reviewSummaryService.startSummarizedReviewAsync(roomNo);
			roomImageSummaryService.startSummarizedImageAsync(roomNo);

			for(int attempt = 0; attempt < 30; attempt++) {
				if(isReadyForFinalSummary(roomNo)) {
					// Reuse the same claim path as the scheduler so both entry points follow identical rules.
					summaryPendingRooms(roomNo);
					return;
				}
				Thread.sleep(2000);
			}

			log.info("방 종합 요약 비동기 처리 대기 시간 초과. roomNo={}", roomNo);
		} catch (Exception e) {
			log.info("방 종합 요약 비동기 처리중 에러 발생 {}: {}", roomNo, e.getMessage());
		}
	}

	@Override
	@Async("aiTaskExecutor")
	public void startEmbeddingAsync(String roomNo) {
		RoomEmbeddingEntity entity = roomEmbeddingRepository.findById(roomNo).orElse(null);
		if(entity == null) {
			return;
		}
		if(STATUS_PROCESSING.equals(entity.getEmbeddingStatus()) || STATUS_DONE.equals(entity.getEmbeddingStatus())) {
			return;
		}
		if(!STATUS_PENDING.equals(entity.getEmbeddingStatus())) {
			return;
		}
		if(!isReadyForEmbedding(roomNo)) {
			return;
		}

		try {
			embedRoom(roomNo);
		} catch (Exception e) {
			log.info("방번호({}) 임베딩 비동기 처리 중 오류 발생: {}", roomNo, e.getMessage());
		}
	}

	@Override
	public List<RoomEmbeddingEntity> findPendingEmbeddableRooms(int limit) {
		if(limit <= 0) {
			return Collections.emptyList();
		}

		List<RoomEmbeddingEntity> targets = new ArrayList<>(limit);
		int page = 0;
		int pageSize = limit;

		while(targets.size() < limit) {
			List<RoomEmbeddingEntity> pendingBatch = roomEmbeddingRepository.findByEmbeddingStatusOrderByUpdatedAtAsc(
					STATUS_PENDING,
					PageRequest.of(page, pageSize)
			);

			if(pendingBatch.isEmpty()) {
				break;
			}

			for(RoomEmbeddingEntity entity : pendingBatch) {
				if(isReadyForEmbedding(entity.getRoomNo())) {
					targets.add(entity);
					if(targets.size() >= limit) {
						break;
					}
				}
			}

			if(pendingBatch.size() < pageSize) {
				break;
			}
			page += 1;
		}

		return targets;
	}

	@Override
	@Transactional
	public EmbedResponse embedRoom(String roomNo) {
		RoomEmbeddingEntity entity = roomEmbeddingRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("Embedding status row not found. roomNo=" + roomNo));

		markEmbeddingProcessing(entity);
		RoomTotalRequest request = buildEmbeddingRoomTotalRequest(roomNo);

		try {
			deleteEmbeededRoomVector(roomNo);
			log.info("기존 방 벡터 삭제 완료. roomNo={}", roomNo);

			EmbedResponse response = webClientBuilder.build()
					.post()
					.uri(aiServerBaseUrl.concat("/ai/embed/room"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(EmbedResponse.class)
					.block();

			if(response == null || !Boolean.TRUE.equals(response.getStatus())) {
				handleEmbeddingFailure(entity, response == null ? "Embedding response is empty." : response.getMessage());
			}

			entity.setEmbeddingStatus(STATUS_DONE);
			entity.setRetryCount(0);
			entity.setLastErrorMessage(null);
			entity.setUpdatedAt(LocalDateTime.now());
			roomEmbeddingRepository.save(entity);
			return response;
		} catch (Exception e) {
			handleEmbeddingFailure(entity, e.getMessage());
			throw new IllegalStateException("unreachable");
		}
	}

	private RoomTotalRequest buildSummaryRoomTotalRequest(String roomNo) {
		return buildRoomTotalRequest(roomNo, false);
	}

	private RoomTotalRequest buildEmbeddingRoomTotalRequest(String roomNo) {
		return buildRoomTotalRequest(roomNo, true);
	}

	private RoomTotalRequest buildRoomTotalRequest(String roomNo, boolean includeSourceLists) {
		RoomEntity room = roomRepository.findById(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("Room not found. roomNo=" + roomNo));
		HouseEntity house = houseRepository.findByRoomNo(roomNo)
				.orElseThrow(() -> new IllegalArgumentException("House not found for room. roomNo=" + roomNo));
		ReviewSummaryEntity reviewSummary = reviewSummaryService.selectSummarizedReview(roomNo);
		RoomImageSummaryEntity imageSummary = roomImageSummaryService.selectSummarizedImageCaption(roomNo);
		List<String> reviews = includeSourceLists
				? reviewRepository.findAllReviewContentsByRoomNo(roomNo)
				: Collections.emptyList();
		List<String> imageCaptions = includeSourceLists
				? roomImageAnalysisRepository.findAllImageCaptionsByRoomNo(roomNo)
				: Collections.emptyList();
		List<String> facilityNames = includeSourceLists
				? roomRepository.findFacilityNamesByRoomNo(roomNo)
				: Collections.emptyList();

		if(imageSummary == null) {
			throw new IllegalStateException("Embedding prerequisites are missing. roomNo=" + roomNo);
		}

		RoomTotalRequest request = RoomTotalRequest.builder()
				.roomNo(roomNo)
				.roomName(defaultString(room.getRoomName()))
				.houseNo(house.getHouseNo())
				.houseName(defaultString(house.getHouseName()))
				.houseAddress(defaultString(house.getHouseAddress()))
				.houseCompletionYear(defaultInt(house.getHouseCompletionYear()))
				.houseFloors(defaultInt(house.getHouseFloors()))
				.houseHouseHolds(defaultInt(house.getHouseHouseHolds()))
				.houseElevatorYn(defaultBoolean(house.getHouseElevatorYn()))
				.housePetYn(defaultBoolean(house.getHousePetYn()))
				.houseFemaleLimit(defaultBoolean(house.getHouseFemaleLimit()))
				.houseParkingMax(defaultInt(house.getHouseParkingMax()))
				.houseAbstract(defaultString(house.getHouseAbstract()))
				.roomCreatedAt(defaultRoomCreatedAt(room))
				.roomUpdatedAt(room.getRoomUpdatedAt())
				.roomDeposit(defaultLong(room.getRoomDeposit()))
				.roomMonthly(resolveRoomMonthly(room))
				.roomMethod(defaultString(room.getRoomMethod()))
				.roomArea(defaultDouble(room.getRoomArea()))
				.roomFacing(defaultString(room.getRoomFacing()))
				.roomAvailableDate(defaultRoomAvailableDate(room))
				.roomAbstract(defaultString(room.getRoomAbstract()))
				.roomRoomCount(defaultInt(room.getRoomRoomCount()))
				.roomBathCount(defaultInt(room.getRoomBathCount()))
				.roomEmptyYn(defaultBoolean(room.getRoomEmptyYn()))
				.roomStatus(defaultString(room.getRoomStatus()))
				.roomOptions(defaultString(room.getRoomOptions()))
				.imageSummary(defaultString(imageSummary.getImageSummary()))
				.imageCaptions(defaultList(imageCaptions))
				.reviewSummary(reviewSummary == null ? "" : defaultString(reviewSummary.getReviewSummary()))
				.reviews(defaultList(reviews))
				.facilityNames(defaultList(facilityNames))
				.build();
//		log.info("Prepared embedding payload. roomNo={}", roomNo);
		return request;
	}

	@Override
	public EmbedResponse deleteEmbeededRoomVector(String roomNo) {
		WebClient webClient = webClientBuilder.build();
		EmbedResponse response = null;

		try {
			response = webClient.delete()
					.uri(aiServerBaseUrl + "/ai/embed/room/{roomNo}", roomNo)
					.retrieve()
					.bodyToMono(EmbedResponse.class)
					.block();
		} catch (Exception e) {
//			log.info("Failed to delete existing room vector. roomNo={}, message={}", roomNo, e.getMessage());
		}

		return response;
	}

	private boolean isReadyForEmbedding(String roomNo) {
		ReviewSummaryEntity reviewSummary = reviewSummaryService.selectSummarizedReview(roomNo);
		if(reviewSummary == null || !STATUS_DONE.equals(reviewSummary.getSummaryStatus())) {
			return false;
		}

		RoomImageSummaryEntity imageSummary = roomImageSummaryService.selectSummarizedImageCaption(roomNo);
		return imageSummary != null && STATUS_DONE.equals(imageSummary.getSummaryStatus());
	}

	private boolean isReadyForFinalSummary(String roomNo) {
		ReviewSummaryEntity reviewSummary = reviewSummaryService.selectSummarizedReview(roomNo);
		List<String> reviews = reviewRepository.findAllReviewContentsByRoomNo(roomNo);
		boolean reviewReady = (reviews == null || reviews.isEmpty())
				|| (reviewSummary != null && STATUS_DONE.equals(reviewSummary.getSummaryStatus()));
		if(!reviewReady) {
			return false;
		}

		RoomImageSummaryEntity imageSummary = roomImageSummaryService.selectSummarizedImageCaption(roomNo);
		return imageSummary != null && STATUS_DONE.equals(imageSummary.getSummaryStatus());
	}

	private boolean isFinalSummaryFresh(RoomFinalSummaryEntity entity, String roomNo) {
		if(entity == null) {
			return false;
		}
		if(!STATUS_DONE.equals(entity.getSummaryStatus())) {
			return false;
		}
		if(entity.getUpdatedAt() == null || entity.getFinalSummary() == null || entity.getFinalSummary().isBlank()) {
			return false;
		}

		RoomEntity room = roomRepository.findById(roomNo).orElse(null);
		ReviewSummaryEntity reviewSummary = reviewSummaryService.selectSummarizedReview(roomNo);
		List<String> reviews = reviewRepository.findAllReviewContentsByRoomNo(roomNo);
		RoomImageSummaryEntity imageSummary = roomImageSummaryService.selectSummarizedImageCaption(roomNo);
		if(room == null || imageSummary == null) {
			return false;
		}
		boolean reviewReady = (reviews == null || reviews.isEmpty())
				|| (reviewSummary != null && STATUS_DONE.equals(reviewSummary.getSummaryStatus()));
		if(!reviewReady || !STATUS_DONE.equals(imageSummary.getSummaryStatus())) {
			return false;
		}

		LocalDateTime latestSourceUpdatedAt = entity.getUpdatedAt();
		latestSourceUpdatedAt = maxDateTime(latestSourceUpdatedAt, room.getRoomUpdatedAt());
		latestSourceUpdatedAt = maxDateTime(latestSourceUpdatedAt, room.getRoomCreatedAt());
		if(reviewSummary != null) {
			latestSourceUpdatedAt = maxDateTime(latestSourceUpdatedAt, reviewSummary.getUpdatedAt());
		}
		latestSourceUpdatedAt = maxDateTime(latestSourceUpdatedAt, imageSummary.getUpdatedAt());
		return !entity.getUpdatedAt().isBefore(latestSourceUpdatedAt);
	}

	private void markEmbeddingProcessing(RoomEmbeddingEntity entity) {
		entity.setEmbeddingStatus(STATUS_PROCESSING);
		entity.setUpdatedAt(LocalDateTime.now());
		entity.setLastErrorMessage(null);
		roomEmbeddingRepository.save(entity);
	}

	private void handleEmbeddingFailure(RoomEmbeddingEntity entity, String message) {
		int retryCount = entity.getRetryCount() == null ? 0 : entity.getRetryCount();
		if(retryCount >= MAX_EMBED_RETRY) {
			entity.setEmbeddingStatus(STATUS_FAILED);
		} else {
			entity.setRetryCount(retryCount + 1);
			entity.setEmbeddingStatus(STATUS_PENDING);
		}
		entity.setLastErrorMessage(message);
		entity.setUpdatedAt(LocalDateTime.now());
		roomEmbeddingRepository.save(entity);
		throw new RuntimeException(message);
	}

	private int defaultInt(Integer value) {
		return value == null ? 0 : value;
	}

	private long defaultLong(Long value) {
		return value == null ? 0L : value;
	}

	private double defaultDouble(Double value) {
		return value == null ? 0.0 : value;
	}

	private boolean defaultBoolean(Boolean value) {
		return value != null && value;
	}

	private String defaultString(String value) {
		return value == null ? "" : value;
	}
	
	private <T> List<T> defaultList(List<T> list) {
		return list == null ? new ArrayList<>() : list; 
	}

	private LocalDateTime defaultRoomCreatedAt(RoomEntity room) {
		if(room.getRoomCreatedAt() != null) {
			return room.getRoomCreatedAt();
		}
		if(room.getRoomUpdatedAt() != null) {
			return room.getRoomUpdatedAt();
		}
		return LocalDateTime.now();
	}

	private LocalDate defaultRoomAvailableDate(RoomEntity room) {
		if(room.getRoomAvailableDate() != null) {
			return room.getRoomAvailableDate();
		}
		if(room.getRoomCreatedAt() != null) {
			return room.getRoomCreatedAt().toLocalDate();
		}
		return LocalDate.now();
	}

	private long resolveRoomMonthly(RoomEntity room) {
		if(room.getRoomMonthly() != null) {
			return room.getRoomMonthly();
		}
		return 0L;
	}

	private LocalDateTime maxDateTime(LocalDateTime left, LocalDateTime right) {
		if(left == null) {
			return right;
		}
		if(right == null) {
			return left;
		}
		return left.isAfter(right) ? left : right;
	}

}
