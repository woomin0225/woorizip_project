package org.team4p.woorizip.room.review.service;

import java.util.List;

import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;

public interface ReviewSummaryService {
	// review AI summary 상태가 PENDING인 방 조회
	List<ReviewSummaryEntity> findSummaryPendingRooms();
	// review AI summary 수행
	void summaryPendingRooms(ReviewSummaryEntity reviewSummaryEntity);
}
