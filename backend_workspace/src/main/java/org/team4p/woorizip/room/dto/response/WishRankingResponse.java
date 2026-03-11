package org.team4p.woorizip.room.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WishRankingResponse {
	private String roomNo;
	private Long wishCount;
    private String roomName;
    private String houseName;
    private String repImageName;    // representative 1장 이름만 넣기
    private Long viewCount;
    
	public WishRankingResponse(String roomNo, Number wishCount, String roomName, String houseName, Number viewCount) {
		super();
		this.roomNo = roomNo;
		this.wishCount = wishCount == null ? 0L : wishCount.longValue();
		this.roomName = roomName;
		this.houseName = houseName;
		this.viewCount = viewCount == null ? 0L : viewCount.longValue();
	}

}
