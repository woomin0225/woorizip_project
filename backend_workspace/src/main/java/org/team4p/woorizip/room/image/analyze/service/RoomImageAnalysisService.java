package org.team4p.woorizip.room.image.analyze.service;

import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;

public interface RoomImageAnalysisService {

	// 저장된 방 이미지 1건을 FastAPI로 분석 요청하고 결과를 DB에 저장
	void analyzeAndSave(RoomImageEntity roomImageEntity);
}
