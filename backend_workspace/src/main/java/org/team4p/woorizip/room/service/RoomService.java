package org.team4p.woorizip.room.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.ReviewRankingResponse;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.dto.response.RoomSearchSliceResponse;
import org.team4p.woorizip.room.dto.response.ViewsRankingResponse;
import org.team4p.woorizip.room.dto.response.WishRankingResponse;

public interface RoomService {
	RoomSearchSliceResponse selectRoomSearch(RoomSearchCondition cond, Pageable pageable);
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
	
	List<ViewsRankingResponse> selectPopularRoomsLastHours(int hours, int limit);	// 최근 n시간 조회수 기반 랭킹 조회

	List<ReviewRankingResponse> selectTopNByRating(int period, int limit);	// 최근 n일 리뷰평균 기반 랭킹 조회
	
	List<WishRankingResponse> selectTopNByWish(int limit);
	
	List<RoomSearchResponse> selectRoomRag(String text);
}
