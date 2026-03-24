package org.team4p.woorizip.room.image.service;

import java.util.List;

import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;

public interface RoomImageSummaryService {
	// image분석 AI summary 상태가 PENDING인 방 조회
	List<RoomImageSummaryEntity> findSummaryPendingRooms();
	// image분석 AI summary 수행
	String summaryPendingRooms(RoomImageSummaryEntity RoomImageSummaryEntity);
	// roomNo로 사진분석 요약결과 조회
	RoomImageSummaryEntity selectSummarizedImageCaption(String roomNo);
	// roomNo 기준 사진 요약 비동기 시작
	void startSummarizedImageAsync(String roomNo);
}
