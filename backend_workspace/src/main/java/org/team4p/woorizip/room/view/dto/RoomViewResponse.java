package org.team4p.woorizip.room.view.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomViewResponse {
	private String roomNo;
	private Integer viewCount;
	private String roomName;
	private String houseName;
	private String repImageName;	// representative
}
