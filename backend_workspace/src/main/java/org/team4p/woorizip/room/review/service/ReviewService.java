package org.team4p.woorizip.room.review.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.room.review.dto.ReviewDto;
import org.team4p.woorizip.room.review.dto.ReviewRankingResponse;

public interface ReviewService {
	Page<ReviewDto> selectRoomReviews(String roomNo, Pageable pageable);
	ReviewDto insertRoomReview(ReviewDto reviewDto, String currentUser);
	void deleteRoomReview(int ReviewNo, String currentUser);
	ReviewDto updateRoomReview(ReviewDto reviewDto, String currentUser);
	List<ReviewRankingResponse> selectTopNByRating(int period, int limit);
}
