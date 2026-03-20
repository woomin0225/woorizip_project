package org.team4p.woorizip.room.image.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;
import org.team4p.woorizip.room.image.service.RoomImageSummaryService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomImageScheduler {

	private final RoomImageSummaryService roomImageSummaryService;

	@Scheduled(initialDelay = 60000, fixedDelay = 600000)
	public void roomImageCaptionsSummery() {
		log.info("방 사진 요약 스케줄러 시작");

		List<RoomImageSummaryEntity> list = roomImageSummaryService.findSummaryPendingRooms();
		int i = 0;

		for(RoomImageSummaryEntity entity : list) {
			if(i >= 50) break;
			if(entity.getSummaryStatus().equals("PROCESSING") || entity.getSummaryStatus().equals("DONE")) continue;
			try {
				String summary = roomImageSummaryService.summaryPendingRooms(entity);
				i += 1;
				log.info("방번호({}) - 사진 요약({}/{}): {}", entity.getRoomNo(), i, (list.size()<50?list.size():50), summary);
			} catch (Exception e) {
				log.info("방번호 {} 사진 요약 중 오류 발생: {}", entity.getRoomNo(), e.getMessage());
			}
		}

		log.info("방 사진 요약 스케줄러 종료");
	}

}
