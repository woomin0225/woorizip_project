package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.Map;

import org.team4p.woorizip.facility.enums.FacilityStatus;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FacilityCreateRequestDTO {
	private String facilityNo;
	private String facilityName;
	private Map<String, Boolean> facilityOptionInfo;
	private int facilityLocation;
	private FacilityStatus facilityStatus;
	private int facilityCapacity;
	private LocalTime facilityOpenTime;
	private LocalTime facilityCloseTime;
	private boolean facilityRsvnRequiredYn;
	private int maxRsvnPerDay;
	private int facilityRsvnUnitMinutes;
	private int facilityMaxDurationMinutes;
}
