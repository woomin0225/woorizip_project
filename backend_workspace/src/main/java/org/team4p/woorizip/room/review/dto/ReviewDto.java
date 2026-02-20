package org.team4p.woorizip.room.review.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDto {
	
	private int reviewNo;
	@NotBlank
	private String roomNo;
	
	private String userNo;
	@Min(value = 1) @Max(value = 5) @NumericOnly
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
