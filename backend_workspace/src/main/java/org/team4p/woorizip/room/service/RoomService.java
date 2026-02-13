package org.team4p.woorizip.room.service;

import java.util.List;

import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

public interface RoomService {
	List<RoomDto> selectRoomSearch(RoomSearchCondition cond);
}
