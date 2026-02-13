package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FacilityDetailResponseDTO {
		private String facilityNo;
		private String facilityName;
		private Map<String, Boolean> facilityOptionInfo;
		private int facilityLocation;
		private LocalTime facilityOpenTime;
		private LocalTime facilityCloseTime;
		private FacilityStatus facilityStatus;
		private Boolean facilityRsvnRequiredYn;
		private int facilityCapacity;
		private Integer maxRsvnPerDay;
		private Integer facilityRsvnUnitMinutes;
		private Integer facilityMaxDurationMinutes;
		@Builder.Default
		private List<FacilityImageDTO> images = new ArrayList<>();
		
		public static FacilityDetailResponseDTO from(FacilityEntity entity) {
		    return FacilityDetailResponseDTO.builder()
		            .facilityNo(entity.getFacilityNo())
		            .facilityName(entity.getFacilityName())
		            .facilityOptionInfo(entity.getFacilityOptionInfo())
		            .facilityLocation(entity.getFacilityLocation())
		            .facilityOpenTime(entity.getFacilityOpenTime())
		            .facilityCloseTime(entity.getFacilityCloseTime())
		            .facilityStatus(entity.getFacilityStatus())
		            .facilityRsvnRequiredYn(entity.getFacilityRsvnRequiredYn())
		            .facilityCapacity(entity.getFacilityCapacity())
		            .maxRsvnPerDay(entity.getMaxRsvnPerDay())
		            .facilityRsvnUnitMinutes(entity.getFacilityRsvnUnitMinutes())
		            .facilityMaxDurationMinutes(entity.getFacilityMaxDurationMinutes())
		            .images(entity.getImages().stream()
		                    .map(FacilityImageDTO::from)
		                    .collect(Collectors.toList()))
		            .build();
		}
}
