package org.team4p.woorizip.room.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.team4p.woorizip.room.dto.ai.EmbedResponse;
import org.team4p.woorizip.room.image.service.RoomImageSummaryService;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.review.service.ReviewSummaryService;
import org.team4p.woorizip.room.service.RoomAiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomScheduler {
	
	private final RoomAiService roomAiService;
	private final ReviewSummaryService reviewSummaryService;
	private final RoomImageSummaryService roomImageSummaryService;
	
	@Scheduled(initialDelay = 1200000, fixedDelay = 1800000)
	public void roomEmbeddingSchedule() {
		log.info("방 임베딩/벡터저장 스케줄러 작동");
		
		List<RoomEmbeddingEntity> list = roomAiService.findEmbeddingPendingRooms();
		
		int i = 0;
		
		for(RoomEmbeddingEntity entity : list) {
			if(i>50) continue;
			if(entity.getEmbeddingStatus().equals("PROCESSING") || entity.getEmbeddingStatus().equals("DONE")) continue;
			if(!reviewSummaryService.selectSummarizedReview(entity.getRoomNo()).getSummaryStatus().equals("DONE")
					||!roomImageSummaryService.selectSummarizedImageCaption(entity.getRoomNo()).getSummaryStatus().equals("DONE")		
			) continue;
			
			try {
				EmbedResponse response = roomAiService.embedRoom(entity.getRoomNo());
				i += 1;
				log.info("방 번호("+response.getRoomNo()+") - 임베딩/벡터저장: "+response.getMessage()+", 저장된 collection:"+response.getCollection());
			} catch (Exception e) {
				log.info("방 번호" + entity.getRoomNo() + "의 임베딩/벡터저장에서 에러 발생: " + e.getMessage());
				continue;
			}
		}
		
		log.info("방 임베딩/벡터저장 스케줄러 종료");
	}
	
}
