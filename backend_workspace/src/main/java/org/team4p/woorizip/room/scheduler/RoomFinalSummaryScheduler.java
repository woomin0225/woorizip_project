package org.team4p.woorizip.room.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.team4p.woorizip.room.jpa.entity.RoomFinalSummaryEntity;
import org.team4p.woorizip.room.service.RoomAiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomFinalSummaryScheduler {

	private final RoomAiService roomAiService;

	@Scheduled(initialDelay = 120000, fixedDelay = 60000)
	public void roomFinalSummarySchedule() {
		// 보조 기능 스케줄러
		// 종합 요약의 메인은 비동기 사용자 요청
		log.info("방 종합 요약 스케줄러 시작");

		List<RoomFinalSummaryEntity> list = roomAiService.findSummaryPendingRooms();
		int i = 0;

		for(RoomFinalSummaryEntity entity : list) {
			if(i >= 50) break;
			if(entity.getSummaryStatus().equals("PROCESSING") || entity.getSummaryStatus().equals("DONE")) continue;
			try {
				// Pass only roomNo so every caller goes through the same claim logic in the service.
				String summary = roomAiService.summaryPendingRooms(entity.getRoomNo());
				i += 1;
				log.info("방번호({}) - 방 종합 요약({}/50): {}", entity.getRoomNo(), i, summary);
			} catch (Exception e) {
				log.info("방번호({}) 방 종합 요약 중 에러 발생: {}", entity.getRoomNo(), e.getMessage());
			}
		}

		log.info("방 종합 요약 스케줄러 종료");
	}

}
