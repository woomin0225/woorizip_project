package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.facility.enums.FacilityStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FacilityCreateRequestDTO {
	
	private int facilityCode;
	
	@NotBlank(message="FacilityName needed")
	private String facilityName;
	
	@NotNull(message="facilityOptionInfo needed")
	private Map<String, Boolean> facilityOptionInfo;
	
	@NotNull(message="facilityLocation needed")
	private int facilityLocation;
	
	@NotNull(message="facilityStatus needed")
	private FacilityStatus facilityStatus;
	
	@NotNull(message="facilityCapacity needed")
	private int facilityCapacity;
	
	@NotNull(message="facilityOpenTime needed")
	private LocalTime facilityOpenTime;
	
	@NotNull(message="facilityCloseTime needed")
	private LocalTime facilityCloseTime;
	
	private boolean facilityRsvnRequiredYn;
	
	private Integer maxRsvnPerDay;
	
	private Integer facilityRsvnUnitMinutes;
	
	private Integer facilityMaxDurationMinutes;
	
	private List<FacilityImageDTO> images;
}