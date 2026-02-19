package org.team4p.woorizip.room.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.type.SearchCriterion;

public interface RoomService {
	Slice<RoomSearchResponse> selectRoomSearch(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion);
	RoomDto insertRoom(RoomDto roomDto, String currentUser);
	void deleteRoom(String roomNo, String currentUserNo);
	RoomDto selectRoom(String roomNo);
	List<RoomDto> selectRoomsByHouseNo(String houseNo);
	RoomDto updateRoom(RoomDto roomDto, String currentUser);
	RoomDto updateRoomAvailability(String roomNo, LocalDateTime date, String userNo);
	
	Slice<RoomSearchResponse> selectRoomsInHouseMarker(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion, String houseNo);
}
