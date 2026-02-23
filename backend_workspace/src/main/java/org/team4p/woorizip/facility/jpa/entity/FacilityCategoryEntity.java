package org.team4p.woorizip.facility.jpa.entity;

import java.util.Map;

import org.team4p.woorizip.facility.dto.FacilityCategoryDTO;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tb_fm_category")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FacilityCategoryEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Integer facilityCode;
	
	@Column(name = "facility_type", length = 10, nullable = false)
	private String facilityType;
	
	@Column(name = "facility_options", columnDefinition = "TEXT", nullable = false)
	@Convert(converter = MapToJsonConverter.class)
	private Map<String, Boolean> facilityOptions;

	public void updateCategory(FacilityCategoryDTO dto, Map<String, Boolean> optionsToMap) {
		if (dto.getFacilityType() != null && !dto.getFacilityType().isBlank()) this.facilityType = dto.getFacilityType();
		if (dto.getFacilityOptions() != null) this.facilityOptions = optionsToMap;
	}
}
