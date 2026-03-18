package org.team4p.woorizip.room.dto.ai;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomTotalRequest {
	private String roomNo;
	private String roomName;
	private String houseNo;
	private String houseName;
	private String houseAddress;
	private Integer houseCompletionYear;
	private Integer houseFloor;
	private Integer houseHouseHolds;
	private Boolean houseElevatorYn;
	private Boolean housePetYn;
	private Boolean houseFemaleLimit;
	private Integer houseParkingMax;
	private String houseAbstract;
	private LocalDateTime roomCreatedAt;
	private LocalDateTime roomUpdatedAt;
	private Long roomDeposit;
	private Long roomMonthly;
	private String roomMethod;
	private Double roomArea;
	private String roomFacing;
	private LocalDate roomAvailableDate;
	private String roomAbstract;
	private Integer roomRoomCount;
	private Integer roomBathCount;
	private Boolean roomEmptyYn;
	private String roomStatus;
	private String roomOptions;
	
	private String imageSummary;
	private String reviewSummary;
}
