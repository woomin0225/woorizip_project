package org.team4p.woorizip.house.jpa.entity;

import java.time.LocalDateTime;

import org.team4p.woorizip.house.dto.HouseDto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Table(name = "tb_houses")
@Entity
public class HouseEntity {

	@Id
	@Column(name = "house_no")
	private String houseNo;

	@Column(name = "house_name")
	private String houseName;

	@Column(name = "user_no")
	private String userNo;

	@Column(name = "house_created_at")
	private LocalDateTime houseCreatedAt;

	@Column(name = "house_updated_at")
	private LocalDateTime houseUpdatedAt;

	@Column(name = "house_updated_at")
	private String houseZip;
	
	@Column(name="house_address")
	private String houseAddress;
	
	@Column(name="house_address_detail")
	private String houseAddressDetail;
	
	@Column(name="house_completion_year")
	private Integer houseCompletionYear;
	
	@Column(name="house_floors")
	private Integer houseFloors;
	
	@Column(name="house_house_holds")
	private Integer houseHouseHolds;
	
	@Column(name="house_elevator_yn")
	private Boolean houseElevatorYn;
	
	@Column(name="house_pet_yn")
	private Boolean housePetYn;
	
	@Column(name="house_female_limit")
	private Boolean houseFemaleLimit;
	
	@Column(name="house_parking_max")
	private Integer houseParkingMax;
	
	@Column(name="house_abstract")
	private String houseAbstract;
	
	@Column(name="house_image_count")
	private Integer houseImageCount;
	
	@Column(name="house_lat")
	private Double houseLat;
	
	@Column(name="house_lng")
	private Double houseLng;
	
	@Column(name="deleted")
	private Boolean deleted;
	
	@Column(name="deleted_at")
	private LocalDateTime deletedAt;

	@PrePersist
	public void prePersist() {
		if (houseNo == null)
			houseNo = java.util.UUID.randomUUID().toString();
		
		if (houseCreatedAt == null)
			houseCreatedAt = LocalDateTime.now();
	}
	
	@PreUpdate
	public void preUpdated() {
		if (houseUpdatedAt == null)
			houseUpdatedAt = LocalDateTime.now();
	}
	
	public HouseDto toDto() {
		return HouseDto.builder()
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
