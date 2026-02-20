package org.team4p.woorizip.room.dto.request;

import java.util.Set;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.room.type.RoomType;
import org.team4p.woorizip.room.type.SearchCriterion;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomSearchCondition {
	private String keyword;	// 검색 키워드
	private RoomType roomType;	// 전세, 월세 구분
	@Min(value = 0) @NumericOnly
	private Integer minTax;	// 최소 월세액
	@Min(value = 1) @NumericOnly
	private Integer maxTax;	// 최대 월세액
	@Min(value = 0) @NumericOnly
	private Integer minDeposit;	// 최소 보증금
	@Min(value = 1) @NumericOnly
	private Integer maxDeposit;	// 최대 보증금
	@NotEmpty
	private Double swLat;	// bbox 남서 위도
	@NotEmpty
	private Double swLng;	// bbox 남서 경도
	@NotEmpty
	private Double neLat;	// bbox 북동 위도
	@NotEmpty
	private Double neLng;	// bbox 북동 경도
	@TextOnly
	private Set<String> options;	// 가구옵션
	@Min(value = 1) @NumericOnly
	private Integer roomRoomCount;	// 방수, 수용인원
	@NotNull
	private Boolean houseElevatorYn;	// 승강기 유무
	@NotNull
	private Boolean housePetYn;	// 애완동물가능여부
	@NotNull
	private Boolean houseFemaleLimit;	// 여성전용여부
	@NotNull
	private Boolean houseParking;	//주차가능여부
	@NotNull
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
