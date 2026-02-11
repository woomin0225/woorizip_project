package org.team4p.woorizip.facility.dto;

import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import lombok.*;

@Getter
@Setter
@Builder
public class FacilityListResponseDTO {
	private String facilityNo;
	private String facilityName;
	
	public static FacilityListResponseDTO from(FacilityEntity entity) {
	    return FacilityListResponseDTO.builder()
	            .facilityNo(entity.getFacilityNo())
	            .facilityName(entity.getFacilityName())
	            .build();
	}
}