package org.team4p.woorizip.facility.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;
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
public class FacilityCategoryCreateRequestDTO {

	@NotBlank
    @Size(max=10)
    private String facilityType;
	
	@NotBlank
    private Map<String, Boolean> facilityOptions;
    
}