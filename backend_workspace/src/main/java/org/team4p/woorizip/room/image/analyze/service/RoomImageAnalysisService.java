package org.team4p.woorizip.room.image.analyze.service;

import org.team4p.woorizip.room.image.analyze.jpa.entity.RoomImageAnalysisEntity;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;

public interface RoomImageAnalysisService {

	// 저장된 방 이미지 1건을 FastAPI로 분석 요청하고 결과를 DB에 저장
	void analyzeAndSave(RoomImageEntity roomImageEntity);
	
	// 임베딩용 텍스트 변환 메소드 
	String buildEmbeddingText(RoomImageAnalysisEntity entity);
	
	// 분석하여 저장한 결과 1건을 db에서 삭제
	void deleteAnalyzedOne(int roomImageNo);
}
