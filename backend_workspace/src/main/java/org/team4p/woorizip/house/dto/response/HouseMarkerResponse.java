package org.team4p.woorizip.house.dto.response;

import java.util.List;

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
	private String houseAddress;
	private double houseLat;
	private double houseLng;
	private long minMonthly;
	private long maxMonthly;
	private long minDeposit;
	private long maxDeposit;
	
	private List<String> imageNames;
	
	public HouseMarkerResponse(HouseEntity houseEntity, long minDeposit, long maxDeposit, long minMonthly, long maxMonthly, List<String> imageNmes) {
		super();
		this.houseNo = houseEntity.getHouseNo();
		this.houseName = houseEntity.getHouseName();
		this.houseAddress = houseEntity.getHouseAddress();
		this.houseLat = houseEntity.getHouseLat();
		this.houseLng = houseEntity.getHouseLng();
		this.minDeposit = minDeposit;
		this.maxDeposit = maxDeposit;
		this.minMonthly = minMonthly;
		this.maxMonthly = maxMonthly;
		this.imageNames = imageNmes;
	}
	
	
}
