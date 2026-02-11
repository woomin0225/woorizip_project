package org.team4p.woorizip.facility.jpa.entity;

import org.team4p.woorizip.facility.dto.FacilityImageDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class FacilityImageEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int facilityImageNo;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_no")
	private String facilityNo;
	
	@Column(name = "facility_original_image_name")
	private String facilityOriginalImageName;
	
	@Column(name = "facility_stored_image_name")
	private String facilityStoredImageName;
	
	public FacilityImageDTO toDto() {
		return FacilityImageDTO.builder()
				.facilityImageNo(facilityImageNo)
				.facilityNo(facilityNo)
				.facilityOriginalImageName(facilityOriginalImageName)
				.facilityStoredImageName(facilityStoredImageName)
				.build();
	}
}
