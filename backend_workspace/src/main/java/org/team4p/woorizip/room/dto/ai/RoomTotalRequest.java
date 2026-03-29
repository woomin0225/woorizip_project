package org.team4p.woorizip.room.dto.ai;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;

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
	private int houseCompletionYear;
	private int houseFloors;
	private int houseHouseHolds;
	private boolean houseElevatorYn;
	private boolean housePetYn;
	private boolean houseFemaleLimit;
	private int houseParkingMax;
	private String houseAbstract;
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
	private LocalDateTime roomCreatedAt;
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
	private LocalDateTime roomUpdatedAt;
	private long roomDeposit;
	private long roomMonthly;
	private String roomMethod;
	private double roomArea;
	private String roomFacing;
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
	private LocalDate roomAvailableDate;
	private String roomAbstract;
	private int roomRoomCount;
	private int roomBathCount;
	private boolean roomEmptyYn;
	private String roomStatus;
	private String roomOptions;
	
	private String imageSummary;
	private List<String> imageCaptions;
	private String reviewSummary;
	private List<String> reviews;
	private List<String> facilityNames;
}
