package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.facility.enums.FacilityStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
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
	
	@Size(max = 20, message = "시설 이름은 20자 이내여야 합니다.")
	@TextOnly
	private String facilityName;
	
	@Size(max = 20, message = "시설 옵션 정보는 최대 10개까지만 등록 가능합니다.")
	private Map<@Size(max = 20, message = "시설 옵션 이름은 20자 이내여야 합니다.") String, Boolean> facilityOptionInfo;
	
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
