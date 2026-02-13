package org.team4p.woorizip.room.dto.request;

import java.util.Set;

import org.team4p.woorizip.room.type.RoomType;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class RoomSearchCondition {
	private String keyword;	// 검색 키워드
	private Integer minTax;	// 최소 월세액
	private Integer maxTax;	// 최대 월세액
	private Integer minDeposit;	// 최소 보증금
	private Integer maxDeposit;	// 최대 보증금
	private Double swLat;	// bbox 남서 위도
	private Double swLng;	// bbox 남서 경도
	private Double neLat;	// bbox 북동 위도
	private Double neLng;	// bbox 북동 경도
	private RoomType roomType;	// 전세, 월세 구분
	private Set<String> options;	// 가구옵션
}
