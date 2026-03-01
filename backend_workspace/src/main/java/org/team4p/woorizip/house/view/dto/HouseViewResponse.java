package org.team4p.woorizip.house.view.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HouseViewResponse {
	private String houseNo;
	private Long viewCount;
	private String houseName;
	private String houseAddress;
	private String repImageName;	// representative
	
	public HouseViewResponse(String houseNo, Number viewCount, String houseName, String houseAddress) {
		super();
		this.houseNo = houseNo;
		this.viewCount = viewCount == null ? 0L : viewCount.longValue();
		this.houseName = houseName;
		this.houseAddress = houseAddress;
	}
}