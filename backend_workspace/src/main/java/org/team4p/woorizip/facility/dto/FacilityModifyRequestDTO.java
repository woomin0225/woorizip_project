package org.team4p.woorizip.facility.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.facility.enums.FacilityStatus;

import jakarta.validation.constraints.AssertTrue;
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
	
	private LocalDateTime blockedStartTime;
	
	private LocalDateTime blockedEndTime;
	
	private Integer facilityCapacity;
	
	private LocalTime facilityOpenTime;
	
	private LocalTime facilityCloseTime;
	
	private Boolean facilityRsvnRequiredYn;
	
	private Integer maxRsvnPerDay;
	
	private Integer facilityRsvnUnitMinutes;
	
	private Integer facilityMaxDurationMinutes;
	
	private List<FacilityImageDTO> images;
	
	@AssertTrue(message = "시설 위치는 0이 아닌 값으로 입력해주세요.")
	public boolean validValidFloor() {
	    return this.facilityLocation != 0;
	}
	
	@AssertTrue(message = "예약이 필요한 시설은 일일 최대 예약 횟수, 예약 단위 시간, 최대 이용 시간 입력이 필요합니다.")
	public boolean validRsvnFieldsValid() {
	    if (facilityRsvnRequiredYn) {
	        return maxRsvnPerDay != null && 
	               facilityRsvnUnitMinutes != null && 
	               facilityMaxDurationMinutes != null;
	    }
	    return true;
	}
	
	@AssertTrue(message = "시설 이용이 불가능한 기간의 범위를 지정해주세요.")
	public boolean validStatusFieldsValid() {
	    if (facilityStatus.equals(FacilityStatus.UNAVAILABLE)) {
	        return blockedStartTime != null && 
	               blockedEndTime != null;
	    }
	    return true;
	}
}
