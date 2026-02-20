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
    
    @Size(max=10)
    private String facilityType;
    
    private List<String> facilityOptions;
    
    public static FacilityCategoryDTO from(FacilityCategoryEntity entity) {
	    return FacilityCategoryDTO.builder()
	    		.facilityCode(entity.getFacilityCode())
	    		.facilityType(entity.getFacilityType())
	    		.facilityOptions(new ArrayList<>(entity.getFacilityOptions().keySet()))
	            .build();
	}
}
