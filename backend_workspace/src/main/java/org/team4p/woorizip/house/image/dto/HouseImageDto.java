package org.team4p.woorizip.house.image.dto;

import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseImageDto {
	private int houseImageNo;
	private String houseNo;
	private String houseOriginalImageName;
	private String houseStoredImageName;
	
	public HouseImageEntity toEntity() {
		return HouseImageEntity.builder()
								.houseImageNo(houseImageNo)
								.houseNo(houseNo)
								.houseOriginalImageName(houseOriginalImageName)
								.houseStoredImageName(houseStoredImageName)
								.build();
							
	}
}
