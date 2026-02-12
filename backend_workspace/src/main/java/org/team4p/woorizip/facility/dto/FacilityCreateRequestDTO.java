package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.facility.enums.FacilityStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FacilityCreateRequestDTO {
	private String facilityNo;
	private int facilityCode;
	private String facilityName;
	private Map<String, Boolean> facilityOptionInfo;
	private int facilityLocation;
	private FacilityStatus facilityStatus;
	private int facilityCapacity;
	private LocalTime facilityOpenTime;
	private LocalTime facilityCloseTime;
	private boolean facilityRsvnRequiredYn;
	private Integer maxRsvnPerDay;
	private Integer facilityRsvnUnitMinutes;
	private Integer facilityMaxDurationMinutes;
	private List<FacilityImageDTO> images;
}
