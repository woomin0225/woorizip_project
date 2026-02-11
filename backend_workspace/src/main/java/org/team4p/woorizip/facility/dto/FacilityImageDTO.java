package org.team4p.woorizip.facility.dto;

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
}
