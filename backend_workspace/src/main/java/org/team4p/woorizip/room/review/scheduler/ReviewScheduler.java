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

	private final ReviewSummaryService reviewSummaryService;

	@Scheduled(initialDelay = 360000, fixedDelay = 60000)
	public void roomReviewSummery() {
		log.info("방 리뷰 요약 스케줄러 시작");

		List<ReviewSummaryEntity> list = reviewSummaryService.findSummaryPendingRooms();
		int i = 0;

		for(ReviewSummaryEntity entity : list) {
			if(i >= 50) break;
			if(entity.getSummaryStatus().equals("PROCESSING") || entity.getSummaryStatus().equals("DONE")) continue;
			try {
				String summary = reviewSummaryService.summaryPendingRooms(entity);
				i += 1;
				log.info("방번호({}) - 리뷰 요약({}/50): {}", entity.getRoomNo(), i, (list.size()<50?list.size():50), summary);
			} catch (Exception e) {
				log.info("방번호 {} 리뷰 요약 중 오류 발생: {}", entity.getRoomNo(), e.getMessage());
			}
		}

		log.info("방 리뷰 요약 스케줄러 종료");
	}

}
