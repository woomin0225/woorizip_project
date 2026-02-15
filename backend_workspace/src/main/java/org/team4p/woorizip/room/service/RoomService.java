package org.team4p.woorizip.room.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.type.SearchCriterion;

public interface RoomService {
	Slice<RoomSearchResponse> selectRoomSearch(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion);
	RoomDto insertRoom(RoomDto roomDto);
}
