package org.team4p.woorizip.facility.jpa.entity;

import java.time.*;

import org.hibernate.annotations.*;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
public class FacilityEntity {
	@Id
	private String facilityNo;
	private String houseNo;
	private String facilityName;
	private String facilityOptionInfo;
	private int facilityLocation;
	private LocalTime facilityOpenTime;
	private LocalTime facilityCloseTime;
	@Enumerated(EnumType.STRING)
	private FacilityStatus facilityStatus;
	private Boolean facilityRsvnRequiredYn;
	@CreationTimestamp
	private LocalDateTime facilityCreatedAt;
	private LocalDateTime facilityUpdatedAt;
	private LocalDateTime facilityDeletedAt;
	private Integer maxRsvnPerDay;
	private Integer facilityRsvnUnitMinutes;
	private Integer facilityMaxDurationMinutes;
}
