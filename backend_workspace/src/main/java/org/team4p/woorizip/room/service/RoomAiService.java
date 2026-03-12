package org.team4p.woorizip.room.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.room.dto.response.RoomAiAnalyzeResponse;

public interface RoomAiService {
	RoomAiAnalyzeResponse analyzeRoomImages(List<MultipartFile> images);
}
