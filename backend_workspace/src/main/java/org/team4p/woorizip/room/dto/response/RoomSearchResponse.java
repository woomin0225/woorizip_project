package org.team4p.woorizip.room.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomSearchResponse {
	// 방 검색시 리스트 출력을 위한 RoomDto에서 축약된 필드 구성
	private String roomNo;
	private String roomName;
	private String houseNo;
	private LocalDateTime roomUpdatedAt;
	private Long roomDeposit;
	private Long roomMonthly;
	private String roomMethod;
	private Double roomArea;
	private String roomFacing;
	private Integer roomRoomCount;
	private Boolean roomEmptyYn;
	private Boolean canTourApply;
	private Boolean canContractApply;
	private LocalDate occupancyEndDate;
	private Integer roomImageCount;
	private String houseName;
	private String houseAddress;
	
	private List<String> imageNames;
}
