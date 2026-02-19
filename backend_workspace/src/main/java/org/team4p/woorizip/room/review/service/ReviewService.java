package org.team4p.woorizip.room.review.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.room.review.dto.ReviewDto;

public interface ReviewService {
	Page<ReviewDto> selectRoomReviews(String roomNo, Pageable pageable);
	ReviewDto insertRoomReview(ReviewDto reviewDto);
	void deleteRoomReview(int ReviewNo, String userNo);
}
