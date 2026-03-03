package org.team4p.woorizip.room.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRankingResponse {
    private String roomNo;
    private Double avgRating;
    private String roomName;
    private String houseName;
    private String repImageName;    // representative 1장 이름만 넣기
    private Long viewCount;

    public ReviewRankingResponse(String roomNo, Number avgRating, String roomName, String houseName, Number viewCount) {
        this.roomNo = roomNo;
        this.avgRating = avgRating == null ? 0.0 : avgRating.doubleValue();
        this.roomName = roomName;
        this.houseName = houseName;
        this.viewCount = viewCount == null ? 0L : viewCount.longValue();
    }	// repImageName은 service에서 setter로 삽입
}
