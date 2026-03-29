package org.team4p.woorizip.room.review.dto.ai;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReviewSummaryRequest {
	private String roomNo;
	private List<String> texts; 
}
