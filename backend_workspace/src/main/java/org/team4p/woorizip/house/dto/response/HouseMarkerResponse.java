package org.team4p.woorizip.house.dto.response;

import org.team4p.woorizip.house.jpa.entity.HouseEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseMarkerResponse {
	private String houseNo;
	private String houseName;
	private double houseLat;
	private double houseLng;
	private int minMonthly;
	private int maxMonthly;
	private int minDeposit;
	private int maxDeposit;
	
	public HouseMarkerResponse(HouseEntity houseEntity, int minDeposit, int maxDeposit, int minMonthly, int maxMonthly) {
		super();
		this.houseNo = houseEntity.getHouseNo();
		this.houseName = houseEntity.getHouseName();
		this.houseLat = houseEntity.getHouseLat();
		this.houseLng = houseEntity.getHouseLng();
		this.minDeposit = minDeposit;
		this.maxDeposit = maxDeposit;
		this.minMonthly = minMonthly;
		this.maxMonthly = maxMonthly;		
	}
	
	
}
