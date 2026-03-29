package org.team4p.woorizip.room.review.dto.ai;

import lombok.Data;

@Data
public class ReviewSummaryResponse {
	private Boolean status;
	private String roomNo;
	private String summary;
	private String message;
}
