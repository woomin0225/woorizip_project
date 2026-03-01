package org.team4p.woorizip.room.view.service;

import java.util.List;

import org.team4p.woorizip.room.view.dto.RoomViewDto;

public interface RoomViewService {
	void upsertRoomView(String roomNo);	// 조회수 1 증가 (정각으로 내림)
	List<RoomViewDto> selectPopularRoomsLastHours(int hours, int limit);	// 최근 n시간 인기 조회
}
