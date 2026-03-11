package org.team4p.woorizip.facility.dto;

import org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity;

import jakarta.validation.constraints.Size;
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
	
	@Size(max = 500, message = "이미지 파일명은 500자 이내여야 합니다.")
	private String facilityOriginalImageName;
	
	@Size(max = 255, message = "시설 이미지 이름은 255자 이내여야 합니다.")
	private String facilityStoredImageName;
	
	public static FacilityImageDTO from(FacilityImageEntity imageEntity) {
        return FacilityImageDTO.builder()
        		.facilityImageNo(imageEntity.getFacilityImageNo())
                .facilityStoredImageName(imageEntity.getFacilityStoredImageName())
                .facilityOriginalImageName(imageEntity.getFacilityOriginalImageName())
                .build();
    }
}
