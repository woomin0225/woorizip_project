package org.team4p.woorizip.room.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.type.SearchCriterion;

public interface RoomService {
	Page<RoomDto> selectRoomSearch(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion);
}
