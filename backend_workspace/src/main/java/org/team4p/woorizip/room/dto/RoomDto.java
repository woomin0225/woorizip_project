package org.team4p.woorizip.room.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.room.jpa.entity.RoomEntity;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class RoomDto {
	private String roomNo;
	
	private String roomName;

	private String houseNo;
	
	private String userNo;
	
	private LocalDateTime roomCreatedAt;
	
	private LocalDateTime roomUpdatedAt;
	
	private Integer roomDeposit;
	
	private Integer roomMonthly;
	
	private String roomMethod;
	
	private Double roomArea;
	
	private String roomFacing;
	
	private LocalDateTime roomAvailableDate;
	
	private String roomAbstract;
	
	private Integer roomRoomCount;
	
	private Integer roomBathCount;
	
	private Boolean roomEmptyYn;
	
	private String roomStatus;
	
	private String roomOptions;
	
	private Integer roomImageCount;
	
	private Boolean deleted;
	
	private LocalDateTime deletedAt;
	
	public RoomEntity toEntity() {
		return RoomEntity.builder()
							.roomNo(roomNo)
							.roomName(roomName)
							.houseNo(houseNo)
							.userNo(userNo)
							.roomCreatedAt(roomCreatedAt)
							.roomUpdatedAt(roomUpdatedAt)
							.roomDeposit(roomDeposit)
							.roomMonthly(roomMonthly)
							.roomMethod(roomMethod)
							.roomArea(roomArea)
							.roomFacing(roomFacing)
							.roomAvailableDate(roomAvailableDate)
							.roomAbstract(roomAbstract)
							.roomRoomCount(roomRoomCount)
							.roomBathCount(roomBathCount)
							.roomEmptyYn(roomEmptyYn)
							.roomStatus(roomStatus)
							.roomOptions(roomOptions)
							.roomImageCount(roomImageCount)
							.deleted(deleted)
							.deletedAt(deletedAt)
							.build();
	}
}
