package org.team4p.woorizip.room.review.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;
import org.team4p.woorizip.room.review.service.ReviewSummaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewScheduler {
// https://tao-tech.tistory.com/2 를 참고하여 작성하였습니다.
	
	private final ReviewSummaryService reviewSummaryService;
	
	@Scheduled(initialDelay = 60000,fixedDelay = 1800000)	// 1000 => 1초 마다 실행	
	public void roomReviewSummery() {
		log.info("방 리뷰 요약 스케줄러 작동");
		
		List<ReviewSummaryEntity> list = reviewSummaryService.findSummaryPendingRooms();
		
		for(ReviewSummaryEntity entity : list) {
			if(entity.getSummaryStatus().equals("PROCESSING") || entity.getSummaryStatus().equals("DONE")) continue;
			try {
				String summary = reviewSummaryService.summaryPendingRooms(entity);
			} catch (Exception e) {
				log.info("방 번호" + entity.getRoomNo() + "의 리뷰요약에서 에러 발생: " + e.getMessage());
				continue;
			}
		}
		
		log.info("방 리뷰 요약 스케줄러 종료");
	}
	
}
