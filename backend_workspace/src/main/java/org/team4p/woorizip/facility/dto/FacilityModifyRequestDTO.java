package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.facility.enums.FacilityStatus;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@Valid
@NoArgsConstructor
@AllArgsConstructor
public class FacilityModifyRequestDTO {
	
	private String facilityNo;
	
	private Integer facilityCode;
	
	@TextOnly
	private String facilityName;
	
	private Map<String, Boolean> facilityOptionInfo;
	
	@NumericOnly
	private Integer facilityLocation;
	
	private FacilityStatus facilityStatus;
	
	@NumericOnly
	private Integer facilityCapacity;
	
	private LocalTime facilityOpenTime;
	
	private LocalTime facilityCloseTime;
	
	private Boolean facilityRsvnRequiredYn;
	
	private Integer maxRsvnPerDay;
	
	private Integer facilityRsvnUnitMinutes;
	
	private Integer facilityMaxDurationMinutes;
	
	private List<FacilityImageDTO> images;
}
