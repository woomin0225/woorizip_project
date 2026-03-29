package org.team4p.woorizip.room.dto.ai;

import lombok.Data;

@Data
public class RoomTotalResponse {
	private Boolean status;	// 성공 또는 실패 여부
	private String roomNo;	// 방 번호
	private String summary;	// 요약결과
	private String message;	// 결과 상태 메세지
}
