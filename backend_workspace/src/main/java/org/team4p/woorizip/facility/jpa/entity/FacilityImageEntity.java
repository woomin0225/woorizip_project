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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_fm_images")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FacilityImageEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int facilityImageNo;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_no")
	private FacilityEntity facilityNo;
	
	@Column(name = "facility_original_image_name")
	private String facilityOriginalImageName;
	
	@Column(name = "facility_stored_image_name")
	private String facilityStoredImageName;
	
	public FacilityImageDTO entityToDto() {
		return FacilityImageDTO.builder()
				.facilityImageNo(facilityImageNo)
				.facilityOriginalImageName(facilityOriginalImageName)
				.facilityStoredImageName(facilityStoredImageName)
				.build();
	}
	
	// 이미지 데이터 변동 추가
}
