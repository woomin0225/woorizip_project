package org.team4p.woorizip.facility.jpa.entity;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.CreationTimestamp;
import org.team4p.woorizip.facility.dto.FacilityModifyRequestDTO;
import org.team4p.woorizip.facility.enums.FacilityStatus;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_fm_list")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FacilityEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private String facilityNo;
	
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "house_no")
	private String houseNo;
	
	@Column(name = "facility_name")
	private String facilityName;
	
	@Column(name = "facility_option_info", columnDefinition = "TEXT")
	@Convert(converter = MapToJsonConverter.class)
	private Map<String, Boolean> facilityOptionInfo;
	
	@Column(name = "facility_location")
	private Integer facilityLocation;
	
	@Column(name = "facility_open_time")
	private LocalTime facilityOpenTime;
	
	@Column(name = "facility_close_time")
	private LocalTime facilityCloseTime;
	
	@Column(name = "facility_status")
	@Enumerated(EnumType.STRING)
	private FacilityStatus facilityStatus;
	
	@Column(name = "facility_rsvn_required_yn")
	private Boolean facilityRsvnRequiredYn;
	
	@Column(name = "facility_capacity")
	private Integer facilityCapacity;
	
	@Column(name = "facility_created_at")
	@CreationTimestamp
	private LocalDateTime facilityCreatedAt;
	
	@Column(name = "facility_updated_at")
	private LocalDateTime facilityUpdatedAt;
	
	@Column(name = "facility_deleted_at")
	private LocalDateTime facilityDeletedAt;
	
	@Column(name = "max_rsvn_per_day")
	private Integer maxRsvnPerDay;
	
	@Column(name = "facility_rsvn_unit_minutes")
	private Integer facilityRsvnUnitMinutes;
	
	@Column(name = "facility_max_duration_minutes")
	private Integer facilityMaxDurationMinutes;
	
	@Builder.Default
	@OneToMany(mappedBy = "facilityNo", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<FacilityImageEntity> images = new ArrayList<>();

	public void updateFacility(FacilityModifyRequestDTO dto) {
		 if (dto.getFacilityName() != null && !dto.getFacilityName().isBlank()) this.facilityName = dto.getFacilityName();
		 if (dto.getFacilityOptionInfo() != null) this.facilityOptionInfo = dto.getFacilityOptionInfo() ;
		 if (dto.getFacilityLocation() != null) this.facilityLocation = dto.getFacilityLocation();
		 if (dto.getFacilityOpenTime() != null) this.facilityOpenTime = dto.getFacilityOpenTime();
		 if (dto.getFacilityCloseTime() != null) this.facilityCloseTime = dto.getFacilityCloseTime();
		 if (dto.getFacilityStatus() != null) {
			 this.facilityStatus = dto.getFacilityStatus();
			 if (this.facilityStatus == FacilityStatus.DELETED) this.facilityDeletedAt = LocalDateTime.now();
			 else this.facilityDeletedAt = null;
		 	}
		 if (dto.getFacilityRsvnRequiredYn() != null) this.facilityRsvnRequiredYn = dto.getFacilityRsvnRequiredYn();
		 if (dto.getFacilityCapacity() != null) this.facilityCapacity = dto.getFacilityCapacity();
		 if (dto.getMaxRsvnPerDay() != null) this.maxRsvnPerDay = dto.getMaxRsvnPerDay();
		 if (dto.getFacilityRsvnUnitMinutes() != null) this.facilityRsvnUnitMinutes = dto.getFacilityRsvnUnitMinutes();
		 if (dto.getFacilityMaxDurationMinutes() != null) this.facilityMaxDurationMinutes = dto.getFacilityMaxDurationMinutes();
		 this.facilityUpdatedAt = LocalDateTime.now();
	}
}
