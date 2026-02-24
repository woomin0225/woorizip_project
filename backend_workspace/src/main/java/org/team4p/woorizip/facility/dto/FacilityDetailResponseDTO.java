package org.team4p.woorizip.facility.dto;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;

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
public class FacilityDetailResponseDTO {
		private String facilityNo;
		private String facilityName;
		private String facilityTitle;
		private Map<String, Boolean> facilityOptionInfo;
		private String facilityLocation;
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
			String displayFloor;
			int floor = entity.getFacilityLocation();
		    
			if (floor < 0) {
		        displayFloor = "B" + Math.abs(floor);
		    } else {
		        displayFloor = String.valueOf(floor);
		    }
		    
		    return FacilityDetailResponseDTO.builder()
		            .facilityNo(entity.getFacilityNo())
		            .facilityName(entity.getFacilityName())
		            .facilityTitle(entity.getCategory().getFacilityType()+" "+entity.getFacilitySequence())
		            .facilityOptionInfo(entity.getFacilityOptionInfo())
		            .facilityLocation(displayFloor)
		            .facilityOpenTime(entity.getFacilityOpenTime())
		            .facilityCloseTime(entity.getFacilityCloseTime())
		            .facilityStatus(entity.getFacilityStatus())
		            .facilityRsvnRequiredYn(entity.getFacilityRsvnRequiredYn())
		            .facilityCapacity(entity.getFacilityCapacity())
		            .maxRsvnPerDay(entity.getMaxRsvnPerDay())
		            .facilityRsvnUnitMinutes(entity.getFacilityRsvnUnitMinutes())
		            .facilityMaxDurationMinutes(entity.getFacilityMaxDurationMinutes())
		            .images(entity
		            		.getImages()
		            		.stream()
		                    .map(FacilityImageDTO::from)
		                    .collect(Collectors.toList()))
		            .build();
		}
}
