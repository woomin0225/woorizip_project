package org.team4p.woorizip.room.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;

public interface RoomService {
	Slice<RoomSearchResponse> selectRoomSearch(RoomSearchCondition cond, Pageable pageable);
	RoomDto insertRoom(RoomDto roomDto, String currentUser);
	void deleteRoom(String roomNo, String currentUserNo);
	RoomDto selectRoom(String roomNo);
	RoomDto selectRoomForEdit(String roomNo);
	List<RoomDto> selectRoomsByHouseNo(String houseNo);
	RoomDto updateRoom(RoomDto roomDto, String currentUser);
	RoomDto updateRoomAvailability(String roomNo, LocalDate date, String userNo);
	
	Slice<RoomSearchResponse> selectRoomsInHouseMarker(RoomSearchCondition cond, Pageable pageable, String houseNo);
	void updateRoomImageCount(String roomNo, int imageCount);
	RoomDto updateRoomEmptyYn(String roomNo, String currentUser);
}
