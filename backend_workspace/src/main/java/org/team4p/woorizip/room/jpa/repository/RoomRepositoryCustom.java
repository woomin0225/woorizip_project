package org.team4p.woorizip.room.jpa.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;

public interface RoomRepositoryCustom {
	void softDeleteByHouseNo(String houseNo);
	Slice<RoomEntity> searchRooms(RoomSearchCondition cond, Pageable pageable);
	Slice<RoomEntity> searchRooms(RoomSearchCondition cond, Pageable pageable, String houseNo);
	long softDeleteByRoomNo(String roomNo);
}
