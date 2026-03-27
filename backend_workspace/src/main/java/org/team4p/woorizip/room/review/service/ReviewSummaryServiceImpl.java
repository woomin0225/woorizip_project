package org.team4p.woorizip.room.review.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.team4p.woorizip.room.review.dto.ai.ReviewSummaryRequest;
import org.team4p.woorizip.room.review.dto.ai.ReviewSummaryResponse;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;
import org.team4p.woorizip.room.review.jpa.repository.ReviewRepository;
import org.team4p.woorizip.room.review.jpa.repository.ReviewSummaryRepository;
import org.team4p.woorizip.room.service.event.RoomAiDownstreamRequestedEvent;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewSummaryServiceImpl implements ReviewSummaryService {

	private final ReviewSummaryRepository reviewSummaryRepository;
	private final ReviewRepository reviewRepository;
	private final WebClient.Builder webClientBuilder;
	private final ApplicationEventPublisher eventPublisher;

	@Value("${ai.server.base-url}")
	private String aiServerUri;

	@Override
	public List<ReviewSummaryEntity> findSummaryPendingRooms() {
		List<ReviewSummaryEntity> list = reviewSummaryRepository.findAllBySummaryStatus("PENDING");
		return list;
	}

	@Override
	@Transactional
	public String summaryPendingRooms(ReviewSummaryEntity entity) {
		// Move current row into PROCESSING before the long AI call.
		entity.setSummaryStatus("PROCESSING");
		reviewSummaryRepository.save(entity);

		String roomNo = entity.getRoomNo();
		List<String> reviews = reviewRepository.findAllReviewContentsByRoomNo(roomNo);
		ReviewSummaryRequest request = ReviewSummaryRequest.builder()
				.roomNo(roomNo)
				.texts(reviews)
				.build();

		WebClient webClient = webClientBuilder.build();
		ReviewSummaryResponse response = null;
		try {
			Mono<ReviewSummaryResponse> monoResponse = webClient.post()
					.uri(aiServerUri.concat("/ai/summary/room/reviews"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(ReviewSummaryResponse.class);
			response = monoResponse.block();
		} catch (Exception e) {
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(e.getMessage());
			} else {
				entity.setRetryCount(entity.getRetryCount() + 1);
				entity.setSummaryStatus("PENDING");
			}
			reviewSummaryRepository.save(entity);
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
			reviewSummaryRepository.save(entity);
			return "요약실패";
		}

		// Persist the finished review summary and wake downstream AI work.
		entity.setReviewSummary(response.getSummary());
		entity.setSummaryStatus("DONE");
		entity.setReviewCount(reviews.size());
		entity.setUpdatedAt(LocalDateTime.now());
		reviewSummaryRepository.save(entity);
		eventPublisher.publishEvent(new RoomAiDownstreamRequestedEvent(roomNo));

		return response.getSummary();
	}

	@Override
	public ReviewSummaryEntity selectSummarizedReview(String roomNo) {
		return reviewSummaryRepository.findById(roomNo).orElse(null);
	}

	@Override
	@Async("aiTaskExecutor")
	public void startSummarizedReviewAsync(String roomNo) {
		ReviewSummaryEntity entity = reviewSummaryRepository.findById(roomNo).orElse(null);
		if(entity == null) {
			return;
		}
		if("PROCESSING".equals(entity.getSummaryStatus()) || "DONE".equals(entity.getSummaryStatus())) {
			return;
		}
		try {
			summaryPendingRooms(entity);
		} catch (Exception e) {
			log.info("방번호({}) 리뷰 요약 비동기 처리 중 오류 발생: {}", roomNo, e.getMessage());
		}
	}

}
