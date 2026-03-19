package org.team4p.woorizip.room.scheduler;

import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.team4p.woorizip.room.dto.ai.EmbedResponse;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.service.RoomAiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomScheduler {

	private static final int EMBEDDING_BATCH_SIZE = 50;

	private final RoomAiService roomAiService;

	@Scheduled(initialDelay = 660000, fixedDelay = 600000)
	public void roomEmbeddingSchedule() {
		log.info("방 정보 임베딩/벡터저장 스케줄러 시작");

		List<RoomEmbeddingEntity> targets = roomAiService.findPendingEmbeddableRooms(EMBEDDING_BATCH_SIZE);
		int processedCount = 0;

		for(RoomEmbeddingEntity entity : targets) {
			try {
				EmbedResponse response = roomAiService.embedRoom(entity.getRoomNo());
				processedCount += 1;
				log.info(
						"방 정보 임베딩/벡터저장 성공 {} ({}/{}): message={}, collection={}",
						response.getRoomNo(),
						processedCount,
						(targets.size()<EMBEDDING_BATCH_SIZE?targets.size():EMBEDDING_BATCH_SIZE),
						response.getMessage(),
						response.getCollection()
				);
			} catch (Exception e) {
				log.info("방 정보 임베딩/벡터저장 중 에러 발생 {}: {}", entity.getRoomNo(), e.getMessage());
			}
		}

		log.info("방 정보 임베딩/벡터저장 스케줄러 종료");
	}

}
