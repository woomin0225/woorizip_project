package org.team4p.woorizip.room.review.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRankingResponse {
    private String roomNo;
    private Integer avgRating;
    private String roomName;
    private String houseName;
    private String repImageName;    // representative 1장 이름만 넣기

    public ReviewRankingResponse(String roomNo, Integer avgRating, String roomName, String houseName){
        this.roomNo = roomNo;
        this.avgRating = avgRating;
        this.roomName = roomName;
        this.houseName = houseName;
    }   // repImageName은 service에서 setter로 삽입
}
