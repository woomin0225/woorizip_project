package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.facility.enums.FacilityStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@Builder
@ToString
@NoArgsConstructor
@AllArgsConstructor
public class FacilityModifyRequestDTO {
	private String facilityNo;
	private int facilityCode;
	private String facilityName;
	private Map<String, Boolean> facilityOptionInfo;
	private Integer facilityLocation;
	private FacilityStatus facilityStatus;
	private Integer facilityCapacity;
	private LocalTime facilityOpenTime;
	private LocalTime facilityCloseTime;
	private Boolean facilityRsvnRequiredYn;
	private Integer maxRsvnPerDay;
	private Integer facilityRsvnUnitMinutes;
	private Integer facilityMaxDurationMinutes;
	private List<FacilityImageDTO> images;
}
