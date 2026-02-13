package org.team4p.woorizip.room.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.type.SearchCriterion;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {
	private RoomRepository roomRepository;
	
	@Override
	public Page<RoomDto> selectRoomSearch(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion) {
		// 방 검색
		Page<RoomEntity> page = roomRepository.search(cond, pageable, criterion);
		return page.map((entity)->entity.toDto());
	}

}
