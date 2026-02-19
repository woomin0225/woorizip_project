package org.team4p.woorizip.house.service;

import java.util.List;

import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

public interface HouseService {
	
	List<HouseMarkerResponse> selectHouseMarkers(RoomSearchCondition cond);
	List<HouseDto> selectHousesByOwnerNo(String userNo);
	HouseDto selectHouse(String houseNo);
	HouseDto insertHouse(HouseDto houseDto);
	HouseDto updateHouse(HouseDto houseDto, String currentUser);
	void deleteHouse(String houseNo, String currentUser);
	
}
