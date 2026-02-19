package org.team4p.woorizip.room.dto.request;

import java.util.Set;

import org.team4p.woorizip.room.type.RoomType;
import org.team4p.woorizip.room.type.SearchCriterion;

import lombok.Data;

@Data
public class RoomSearchCondition {
	private String keyword;	// 검색 키워드
	private RoomType roomType;	// 전세, 월세 구분
	private Integer minTax;	// 최소 월세액
	private Integer maxTax;	// 최대 월세액
	private Integer minDeposit;	// 최소 보증금
	private Integer maxDeposit;	// 최대 보증금
	private Double swLat;	// bbox 남서 위도
	private Double swLng;	// bbox 남서 경도
	private Double neLat;	// bbox 북동 위도
	private Double neLng;	// bbox 북동 경도
	private Set<String> options;	// 가구옵션
	private Integer roomRoomCount;	// 방수, 수용인원
	
	private Boolean houseElevatorYn;	// 승강기 유무
	private Boolean housePetYn;	// 애완동물가능여부
	private Boolean houseFemaleLimit;	// 여성전용여부
	private Boolean houseParking;	//주차가능여부
	
	private SearchCriterion criterion;
	
	//bbox 크기비교해서 ne가 크도록 조정 -> prepersist
	public void adjustment() {
		if (swLat > neLat) {
			Double temp = swLat;
			swLat = neLat;
			neLat = temp;
		}
		if(swLng > neLng) {
			Double temp = swLng;
			swLng = neLng;
			neLng = temp;
		}
	}
}
