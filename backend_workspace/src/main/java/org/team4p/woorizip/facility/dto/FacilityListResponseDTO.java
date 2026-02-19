package org.team4p.woorizip.facility.dto;

import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityListResponseDTO {
	private String facilityNo;
	private String facilityName;
	
	public static FacilityListResponseDTO from(FacilityEntity entity) {
	    return FacilityListResponseDTO
	    		.builder()
	            .facilityNo(entity.getFacilityNo())
	            .facilityName(entity.getFacilityName())
	            .build();
	}
}