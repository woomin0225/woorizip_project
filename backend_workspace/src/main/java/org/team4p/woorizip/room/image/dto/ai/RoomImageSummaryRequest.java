package org.team4p.woorizip.room.image.dto.ai;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class RoomImageSummaryRequest {
	private String roomNo;
	private List<String> texts; 
}
