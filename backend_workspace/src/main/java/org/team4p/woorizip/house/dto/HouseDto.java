package org.team4p.woorizip.house.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseDto {
	
	private String houseNo;
	@NotBlank
	private String houseName;
	@Null(message="userNo는 백엔드에서 설정")
	private String userNo;
	@Null
	private LocalDateTime houseCreatedAt;
	@Null
	private LocalDateTime houseUpdatedAt;
	
	private String houseZip;
	@NotBlank
	private String houseAddress;
	
	private String houseAddressDetail;
	@NotNull
	private int houseCompletionYear;
	@Min(value = 1)
	private int houseFloors;
	@Min(value = 1)
	private int houseHouseHolds;
	@NotNull
	private boolean houseElevatorYn;
	@NotNull
	private boolean housePetYn;
	@NotNull
	private boolean houseFemaleLimit;
	@Min(value = 0)
	private int houseParkingMax;
	
	private String houseAbstract;
	@Null
	private int houseImageCount;
	@Null
	private double houseLat;
	@Null
	private double houseLng;
	@Null
	private boolean deleted;
	@Null
	private LocalDateTime deletedAt;
		
	public HouseEntity toEntity() {
		return HouseEntity.builder()
							.houseNo(houseNo)
							.houseName(houseName)
							.userNo(userNo)
							.houseCreatedAt(houseCreatedAt)
							.houseUpdatedAt(houseUpdatedAt)
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
