package org.team4p.woorizip.room.dto;

import java.time.LocalDateTime;

import org.team4p.woorizip.common.validator.NumericOnly;
import org.team4p.woorizip.common.validator.TextOnly;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
	
	private String roomNo;
	@NotBlank
	private String roomName;
	@Null
	private String houseNo;
	@Null(message="userNo는 백엔드에서 설정")
	private String userNo;
	@Null
	private LocalDateTime roomCreatedAt;
	@Null
	private LocalDateTime roomUpdatedAt;
	@Min(value = 0)
	private long roomDeposit;
	@Min(value = 0)
	private long roomMonthly;
	@NotBlank
	private String roomMethod;
	@Min(value = 0)
	private double roomArea;
	@NotBlank @TextOnly
	private String roomFacing;
	@NotBlank
	private LocalDateTime roomAvailableDate;
	
	private String roomAbstract;
	@Min(value = 1)
	private int roomRoomCount;
	@Min(value = 0)
	private int roomBathCount;
	@NotNull
	private boolean roomEmptyYn;
	@NotNull
	private String roomStatus;
	
	private String roomOptions;
	@Null
	private int roomImageCount;
	@Null
	private boolean deleted;
	@Null
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
