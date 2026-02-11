package org.team4p.woorizip.house.image.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HouseImageDto {
	private int houseImageNo;
	private String houseNo;
	private String houseOriginalImageName;
	private String houseStoredImageName;
}
