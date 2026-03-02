package org.team4p.woorizip.room.view.service;

public interface RoomViewService {
	void upsertRoomView(String roomNo);	// 조회수 1 증가 (정각으로 내림)
}
