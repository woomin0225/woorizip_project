package org.team4p.woorizip.room.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ViewsRankingResponse {
	private String roomNo;
	private Long viewCount;
	private String roomName;
	private String houseName;
	private String repImageName;	// representative
	
	public ViewsRankingResponse(String roomNo, Number viewCount, String roomName, String houseName) {
		super();
		this.roomNo = roomNo;
		this.viewCount = viewCount == null ? 0L : viewCount.longValue();
		this.roomName = roomName;
		this.houseName = houseName;
	}
}
