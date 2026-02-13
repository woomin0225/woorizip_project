package org.team4p.woorizip.room.review.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewDto {
	
	private int reviewNo;
	
	private String roomNo;
	
	private String userNo;
	
	private int rating;
	
	private String reviewContent;
	
	private LocalDateTime reviewCreatedAt;
	
	public ReviewEntity toEntity() {
		return ReviewEntity.builder()
							.reviewNo(reviewNo)
							.roomNo(roomNo)
							.userNo(userNo)
							.rating(rating)
							.reviewContent(reviewContent)
							.reviewCreatedAt(reviewCreatedAt)
							.build();
	}
}
