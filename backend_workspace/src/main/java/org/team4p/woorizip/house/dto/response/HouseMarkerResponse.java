package org.team4p.woorizip.house.dto.response;

import org.team4p.woorizip.house.jpa.entity.HouseEntity;

import lombok.Data;

@Data
public class HouseMarkerResponse {
	private String houseNo;
	private double houseLat;
	private double houseLng;
	private int minPrice;
	private int maxPrice;
	
	public HouseMarkerResponse(HouseEntity houseEntity, int minPrice, int maxPrice) {
		super();
		this.houseNo = houseEntity.getHouseNo();
		this.houseLat = houseEntity.getHouseLat();
		this.houseLng = houseEntity.getHouseLng();
		this.minPrice = minPrice;
		this.maxPrice = maxPrice;
	}
	
	
}
