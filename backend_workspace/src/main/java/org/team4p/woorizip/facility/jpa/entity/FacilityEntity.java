package org.team4p.woorizip.facility.jpa.entity;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.CreationTimestamp;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
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
	private int facilityLocation;
	
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
	private int facilityCapacity;
	
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
	@OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<FacilityImageEntity> images = new ArrayList<>();
}
