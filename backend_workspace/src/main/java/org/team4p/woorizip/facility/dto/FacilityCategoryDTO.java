package org.team4p.woorizip.facility.dto;

import java.util.Map;

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
    
    @Size(max=10)
    private String facilityType;
    
    private Map<String, Boolean> facilityOptions;
    
    public static FacilityCategoryDTO from(FacilityCategoryEntity entity) {
	    return FacilityCategoryDTO.builder()
	    		.facilityCode(entity.getFacilityCode())
	    		.facilityType(entity.getFacilityType())
	    		.facilityOptions(entity.getFacilityOptions())
	            .build();
	}
}
