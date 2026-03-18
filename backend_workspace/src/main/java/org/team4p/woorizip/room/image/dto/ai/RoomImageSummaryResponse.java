package org.team4p.woorizip.room.image.dto.ai;

import lombok.Data;

@Data
public class RoomImageSummaryResponse {
	private Boolean status;
	private String roomNo;
	private String summary;
	private String message;
}
