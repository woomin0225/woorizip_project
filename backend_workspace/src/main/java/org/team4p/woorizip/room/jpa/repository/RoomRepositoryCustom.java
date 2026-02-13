package org.team4p.woorizip.room.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;

public interface RoomRepositoryCustom {
	void softDeleteByHouseNo(String houseNo);
	Page<RoomEntity> search(RoomSearchCondition cond, Pageable pageable);
}
