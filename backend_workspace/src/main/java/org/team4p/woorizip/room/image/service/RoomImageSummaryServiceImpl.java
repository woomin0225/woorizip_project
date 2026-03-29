package org.team4p.woorizip.room.image.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.team4p.woorizip.room.image.analyze.jpa.repository.RoomImageAnalysisRepository;
import org.team4p.woorizip.room.image.dto.ai.RoomImageSummaryRequest;
import org.team4p.woorizip.room.image.dto.ai.RoomImageSummaryResponse;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageSummaryRepository;
import org.team4p.woorizip.room.service.event.RoomAiDownstreamRequestedEvent;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class RoomImageSummaryServiceImpl implements RoomImageSummaryService {

	private final RoomImageSummaryRepository roomImageSummaryRepository;
	private final RoomImageAnalysisRepository roomImageAnalysisRepository;
	private final WebClient.Builder webClientBuilder;
	private final ApplicationEventPublisher eventPublisher;

	@Value("${ai.server.base-url}")
	private String aiServerUri;

	@Override
	public List<RoomImageSummaryEntity> findSummaryPendingRooms() {
		List<RoomImageSummaryEntity> list = roomImageSummaryRepository.findAllBySummaryStatus("PENDING");
		return list;
	}

	@Override
	@Transactional
	public String summaryPendingRooms(RoomImageSummaryEntity entity) {
		// Move current row into PROCESSING before the long AI call.
		entity.setSummaryStatus("PROCESSING");
		roomImageSummaryRepository.save(entity);

		String roomNo = entity.getRoomNo();
		List<String> analyzedList = roomImageAnalysisRepository.findAllImageCaptionsByRoomNo(roomNo);
		RoomImageSummaryRequest request = RoomImageSummaryRequest.builder()
				.roomNo(roomNo)
				.texts(analyzedList)
				.build();

		WebClient webClient = webClientBuilder.build();
		RoomImageSummaryResponse response = null;
		try {
			Mono<RoomImageSummaryResponse> monoResponse = webClient.post()
					.uri(aiServerUri.concat("/ai/summary/room/images"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(RoomImageSummaryResponse.class);
			response = monoResponse.block();
		} catch (Exception e) {
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(e.getMessage());
			} else {
				entity.setRetryCount(entity.getRetryCount() + 1);
				entity.setSummaryStatus("PENDING");
			}
			roomImageSummaryRepository.save(entity);
			return "요약실패";
		}

		if(response.getStatus() != true) {
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(response.getStatus() + response.getMessage());
			} else {
				entity.setRetryCount(entity.getRetryCount() + 1);
				entity.setSummaryStatus("PENDING");
			}
			roomImageSummaryRepository.save(entity);
			return "요약실패";
		}

		// Persist the finished image summary and wake downstream AI work.
		entity.setImageSummary(response.getSummary());
		entity.setSummaryStatus("DONE");
		entity.setImageCount(analyzedList.size());
		entity.setUpdatedAt(LocalDateTime.now());
		roomImageSummaryRepository.save(entity);
		eventPublisher.publishEvent(new RoomAiDownstreamRequestedEvent(roomNo));

		return response.getSummary();
	}

	@Override
	public RoomImageSummaryEntity selectSummarizedImageCaption(String roomNo) {
		return roomImageSummaryRepository.findById(roomNo).orElse(null);
	}

	@Override
	@Async("aiTaskExecutor")
	public void startSummarizedImageAsync(String roomNo) {
		RoomImageSummaryEntity entity = roomImageSummaryRepository.findById(roomNo).orElse(null);
		if(entity == null) {
			return;
		}
		if("PROCESSING".equals(entity.getSummaryStatus()) || "DONE".equals(entity.getSummaryStatus())) {
			return;
		}
		try {
			summaryPendingRooms(entity);
		} catch (Exception e) {
			log.info("방번호({}) 사진 요약 비동기 처리 중 오류 발생: {}", roomNo, e.getMessage());
		}
	}

}
