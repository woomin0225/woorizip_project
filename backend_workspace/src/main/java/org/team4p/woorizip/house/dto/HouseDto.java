package org.team4p.woorizip.house.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.house.jpa.entity.HouseEntity;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class HouseDto {
	
	private String houseNo;

	private String houseName;

	private String userNo;

	private LocalDateTime houseCreatedAt;

	private LocalDateTime houseUpdatedAt;

	private String houseZip;
	
	private String houseAddress;
	
	private String houseAddressDetail;
	
	private Integer houseCompletionYear;
	
	private Integer houseFloors;
	
	private Integer houseHouseHolds;
	
	private Boolean houseElevatorYn;
	
	private Boolean housePetYn;
	
	private Boolean houseFemaleLimit;
	
	private Integer houseParkingMax;
	
	private String houseAbstract;
	
	private Integer houseImageCount;
	
	private Double houseLat;
	
	private Double houseLng;
	
	private Boolean deleted;
	
	private LocalDateTime deletedAt;
		
	public HouseEntity toEntity() {
		return HouseEntity.builder()
							.houseNo(houseNo)
							.houseName(houseName)
							.userNo(userNo)
							.houseCreatedAt(houseCreatedAt)
							.houseZip(houseZip)
							.houseAddress(houseAddress)
							.houseAddressDetail(houseAddressDetail)
							.houseCompletionYear(houseCompletionYear)
							.houseFloors(houseFloors)
							.houseHouseHolds(houseHouseHolds)
							.houseElevatorYn(houseElevatorYn)
							.housePetYn(housePetYn)
							.houseFemaleLimit(houseFemaleLimit)
							.houseParkingMax(houseParkingMax)
							.houseAbstract(houseAbstract)
							.houseImageCount(houseImageCount)
							.houseLat(houseLat)
							.houseLng(houseLng)
							.deleted(deleted)
							.deletedAt(deletedAt)
							.build();
	}
}
