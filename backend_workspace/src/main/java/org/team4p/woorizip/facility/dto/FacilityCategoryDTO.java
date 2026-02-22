package org.team4p.woorizip.facility.dto;

import java.util.ArrayList;
import java.util.List;

import org.team4p.woorizip.facility.jpa.entity.FacilityCategoryEntity;

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
public class FacilityCategoryDTO {
	
    private Integer facilityCode;
    
    @Size(max=10, message = "시설 카테고리 이름은 10자 이내여야 합니다.")
    private String facilityType;
    
    @Size(max = 10, message = "카테고리 기본 옵션은 최대 10개까지만 등록 가능합니다.")
    private List<@Size(max = 20, message = "카테고리 기본 옵션 이름은 20자 이내여야 합니다.") String> facilityOptions;
    
    public static FacilityCategoryDTO from(FacilityCategoryEntity entity) {
	    return FacilityCategoryDTO.builder()
	    		.facilityCode(entity.getFacilityCode())
	    		.facilityType(entity.getFacilityType())
	    		.facilityOptions(new ArrayList<>(entity.getFacilityOptions().keySet()))
	            .build();
	}
}
