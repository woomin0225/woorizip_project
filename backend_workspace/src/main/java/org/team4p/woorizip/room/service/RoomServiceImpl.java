package org.team4p.woorizip.room.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {
	private RoomRepository roomRepository;
	
	@Override
	public List<RoomDto> selectRoomSearch(RoomSearchCondition cond) {
		// TODO Auto-generated method stub
		return null;
	}

}
