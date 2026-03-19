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
// https://tao-tech.tistory.com/2 를 참고하여 작성하였습니다.
	
	private final RoomImageSummaryService roomImageSummaryService;
	
	@Scheduled(initialDelay = 60000, fixedDelay = 1800000)	// 1000 => 1초 마다 실행	
	public void roomImageCaptionsSummery() {
		log.info("방 사진 분석결과 요약 스케줄러 작동");
		
		List<RoomImageSummaryEntity> list = roomImageSummaryService.findSummaryPendingRooms();
	
		int i = 0;
		
		for(RoomImageSummaryEntity entity : list) {
			if(i > 50) continue;
			if(entity.getSummaryStatus().equals("PROCESSING") || entity.getSummaryStatus().equals("DONE")) continue;
			try {
				String summary = roomImageSummaryService.summaryPendingRooms(entity);
				i += 1;
			} catch (Exception e) {
				log.info("방 번호" + entity.getRoomNo() + "의 사진분석결과 요약에서 에러 발생: " + e.getMessage());
				continue;
			}
		}
		
		log.info("방 사진 분석결과 요약 스케줄러 종료");
	}
	
}
