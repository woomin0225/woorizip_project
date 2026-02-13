package org.team4p.woorizip.room.dto.request;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class RoomSearchCondition {
	private String keyword;	// 검색 키워드
	private int minTax;	// 최소 월세액
	private int maxTax;	// 최대 월세액
	private int minDeposit;	// 최소 보증금
	private int maxDeposit;	// 최대 보증금
	private double swLat;	// bbox 남서 위도
	private double swLng;	// bbox 남서 경도
	private double neLat;	// bbox 북동 위도
	private double neLng;	// bbox 북동 경도
	private String roomType;	// 전세, 월세 구분
	private List<String> options;	// 가구옵션
}
