package org.team4p.woorizip.room.review.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.team4p.woorizip.room.review.dto.ai.ReviewSummaryRequest;
import org.team4p.woorizip.room.review.dto.ai.ReviewSummaryResponse;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;
import org.team4p.woorizip.room.review.jpa.repository.ReviewRepository;
import org.team4p.woorizip.room.review.jpa.repository.ReviewSummaryRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ReviewSummaryServiceImpl implements ReviewSummaryService{

	private final ReviewSummaryRepository reviewSummaryRepository;
	private final ReviewRepository reviewRepository;
	private final WebClient.Builder webClientBuilder;
	
	@Value("${ai.server.base-url}")
	private String aiServerUri;
	
	@Override
	public List<ReviewSummaryEntity> findSummaryPendingRooms() {
		List<ReviewSummaryEntity> list = reviewSummaryRepository.findAllBySummaryStatus("PENDING");
		
		return list;
	}

	@Override
	@Transactional
	public void summaryPendingRooms(ReviewSummaryEntity entity) {
		// state를 PROCESSING으로 전환
		entity.setSummaryStatus("PROCESSING");
		reviewSummaryRepository.save(entity);
		
		// 요약할 리뷰목록 조회
		String roomNo = entity.getRoomNo();
		List<String> reviews = reviewRepository.findAllByRoomNoOrderByReviewCreatedAtDesc(roomNo);
		ReviewSummaryRequest request = ReviewSummaryRequest.builder()
								.roomNo(roomNo)
								.texts(reviews)
								.build();
		
		// AI 서버에서 요약 엔드포인트 호출
		WebClient webClient = webClientBuilder.build();
		ReviewSummaryResponse response = null;
		try {
			Mono<ReviewSummaryResponse> monoResponse = webClient.post()
					.uri(aiServerUri.concat("/ai/summary/room/reviews"))
					.bodyValue(request)
					.retrieve()
					.bodyToMono(ReviewSummaryResponse.class)
					;
			response = monoResponse.block();
			
		} catch (Exception e) {
			// 실패시 state를 retry count +1 처리. 단, retry count 3일 경우 FAILED로 상태 전환
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(e.getMessage());
				
			}else {
				entity.setRetryCount(entity.getRetryCount()+1);
				entity.setSummaryStatus("PENDING");
			}
			reviewSummaryRepository.save(entity);
			return;
		}
		
		if(response.getStatus() != true) {
			// 실패시 state를 retry count +1 처리. 단, retry count 3일 경우 FAILED로 상태 전환
			if(entity.getRetryCount() >= 3) {
				entity.setSummaryStatus("FAILED");
				entity.setLastErrorMessage(response.getStatus() + response.getMessage());
			}else {
				entity.setRetryCount(entity.getRetryCount()+1);
				entity.setSummaryStatus("PENDING");
			}
			reviewSummaryRepository.save(entity);
			return;
		}
			// 요약문구 저장하고, state를 DONE으로 전환, 업데이트 일시를 현재일시로 최신화
			entity.setReviewSummary(response.getSummary());
			entity.setSummaryStatus("DONE");
			entity.setUpdatedAt(LocalDateTime.now());
			reviewSummaryRepository.save(entity);
		
	}

}
