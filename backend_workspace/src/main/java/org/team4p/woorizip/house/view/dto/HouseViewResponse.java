package org.team4p.woorizip.house.view.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseViewResponse {
	private String houseNo;
	private Integer viewCount;
	private String houseName;
	private String houseAddress;
	private String repImageName;	// representative
}