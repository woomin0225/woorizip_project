package org.team4p.woorizip.room.review.dto.ai;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class SimpleReviewContent {
	@Column(name="review_content")
	private String reviewContent;
	@Column(name="review_created_at")
	private LocalDateTime reviewCreatedAt;
}
