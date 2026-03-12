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
	private LocalDateTime roomCreatedAt;
	private LocalDateTime roomUpdatedAt;
	private Integer roomDeposit;
	private Integer roomMonthly;
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
