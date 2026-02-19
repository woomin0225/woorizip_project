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

<<<<<<< Updated upstream
@Entity
@Table(name = "tb_fm_images")
=======
//@Entity
>>>>>>> Stashed changes
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FacilityImageEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private int facilityImageNo;
	
	// 경로: org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity
//	@ManyToOne
//	@JoinColumn(name = "facility_no") 
	private FacilityEntity facility; // <--- 이 이름이 기준입니다.
	
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
