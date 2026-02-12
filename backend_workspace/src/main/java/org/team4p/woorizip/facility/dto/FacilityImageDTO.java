package org.team4p.woorizip.facility.dto;

import org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity;

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
public class FacilityImageDTO {
	private Integer facilityImageNo;
	private String facilityOriginalImageName;
	private String facilityStoredImageName;
	
	public static FacilityImageDTO from(FacilityImageEntity imageEntity) {
        return FacilityImageDTO.builder()
        		.facilityImageNo(imageEntity.getFacilityImageNo())
                .facilityStoredImageName(imageEntity.getFacilityStoredImageName())
                .facilityOriginalImageName(imageEntity.getFacilityOriginalImageName())
                .build();
    }
}
