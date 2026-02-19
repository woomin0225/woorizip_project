package org.team4p.woorizip.facility.jpa.entity;

import java.util.Map;

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
	private int facilityCode;
	
	@Column(name = "facility_type")
	private String facilityType;
	
	@Column(name = "facility_options")
	@Convert(converter = MapToJsonConverter.class)
	private Map<String, Boolean> facilityOptions;
}
