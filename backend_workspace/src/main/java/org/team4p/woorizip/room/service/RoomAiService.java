package org.team4p.woorizip.room.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.room.dto.ai.EmbedResponse;
import org.team4p.woorizip.room.dto.response.RoomAiAnalyzeResponse;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;

public interface RoomAiService {
	RoomAiAnalyzeResponse analyzeRoomImages(List<MultipartFile> images);
	
	String selectSummarizedRoom(String roomNo);
	
	EmbedResponse embedRoom(String roomNo);
	
	List<RoomEmbeddingEntity> findEmbeddingPendingRooms();
	
	EmbedResponse deleteEmbeededRoomVector(String roomNo);
}
