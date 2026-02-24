package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.team4p.woorizip.common.validator.TextOnly;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class FacilityCreateRequestDTO {
	
	@NotBlank(message="시설을 등록할 건물을 선택해주세요.")
	private String houseNo;
	
	@NotNull(message="시설 카테고리를 선택해주세요.")
	private Integer facilityCode;
	
	@NotBlank(message="시설 이름 입력이 필요합니다.")
	@Size(max = 20, message = "시설 이름은 20자 이내여야 합니다.")
	@TextOnly
	private String facilityName;
	
	@NotNull(message="시설 옵션 정보가 필요합니다.")
	@Size(max = 20, message = "시설 옵션 정보는 최대 10개까지만 등록 가능합니다.")
	private Map<@Size(max = 20, message = "시설 옵션 이름은 20자 이내여야 합니다.") String, Boolean> facilityOptionInfo;
	
	@NotNull(message="시설 위치 정보가 필요합니다.")
	private int facilityLocation;
	
	@NotNull(message="시설 수용 가능 인원 입력이 필요합니다.")
	private int facilityCapacity;
	
	@NotNull(message="시설 운영 시작 시간 입력이 필요합니다.")
	private LocalTime facilityOpenTime;
	
	@NotNull(message="시설 운영 종료 시간 입력이 필요합니다.")
	private LocalTime facilityCloseTime;
	
	private boolean facilityRsvnRequiredYn;
	
	private Integer maxRsvnPerDay;
	
	private Integer facilityRsvnUnitMinutes;
	
	private Integer facilityMaxDurationMinutes;
	
	private List<FacilityImageDTO> images;
	
	@AssertTrue(message = "시설 위치는 0이 아닌 값으로 입력해주세요.")
	public boolean isValidFloor() {
	    return this.facilityLocation != 0;
	}
	
	@AssertTrue(message = "예약이 필요한 시설은 일일 최대 예약 횟수, 예약 단위 시간, 최대 이용 시간 입력이 필요합니다.")
	public boolean isRsvnFieldsValid() {
	    if (facilityRsvnRequiredYn) {
	        return maxRsvnPerDay != null && 
	               facilityRsvnUnitMinutes != null && 
	               facilityMaxDurationMinutes != null;
	    }
	    return true;
	}
}