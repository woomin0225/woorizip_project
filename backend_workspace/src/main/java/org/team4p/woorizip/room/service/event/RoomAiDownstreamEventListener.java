package org.team4p.woorizip.room.service.event;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.team4p.woorizip.room.service.RoomAiService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RoomAiDownstreamEventListener {

	private final RoomAiService roomAiService;

	@Async("aiTaskExecutor")
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void handle(RoomAiDownstreamRequestedEvent event) {
		String roomNo = event.getRoomNo();
		if(roomNo == null || roomNo.isBlank()) {
			return;
		}

		roomAiService.requestSummarizedRoom(roomNo);
		roomAiService.startSummarizedRoomAsync(roomNo);
		roomAiService.startEmbeddingAsync(roomNo);
	}
}
