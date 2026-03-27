package org.team4p.woorizip.room.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.room.dto.ai.EmbedResponse;
import org.team4p.woorizip.room.dto.response.RoomAiAnalyzeResponse;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.jpa.entity.RoomFinalSummaryEntity;

public interface RoomAiService {
	RoomAiAnalyzeResponse analyzeRoomImages(List<MultipartFile> images);
	
	RoomFinalSummaryEntity requestSummarizedRoom(String roomNo);
	RoomFinalSummaryEntity selectSummarizedRoom(String roomNo);
	List<RoomFinalSummaryEntity> findSummaryPendingRooms();
	String summaryPendingRooms(String roomNo);
	void startSummarizedRoomAsync(String roomNo);
	void startEmbeddingAsync(String roomNo);
	
	EmbedResponse embedRoom(String roomNo);
	
	List<RoomEmbeddingEntity> findPendingEmbeddableRooms(int limit);
	
	EmbedResponse deleteEmbeededRoomVector(String roomNo);
}
