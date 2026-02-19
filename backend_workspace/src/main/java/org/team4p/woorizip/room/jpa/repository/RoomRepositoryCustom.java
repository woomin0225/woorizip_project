package org.team4p.woorizip.room.jpa.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.type.SearchCriterion;

public interface RoomRepositoryCustom {
	void softDeleteByHouseNo(String houseNo);
	Slice<RoomEntity> searchRooms(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion);
	long softDeleteByRoomNo(String roomNo);
}
