package org.team4p.woorizip.room.image.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomImageServiceImpl implements RoomImageService {
	private final RoomImageRepository roomImageRepository;
	
	@Override
	public List<RoomImageDto> selectRoomImages(String roomNo) {
		// 방에 해당하는 사진 리스트 조회
		List<RoomImageEntity> rows = roomImageRepository.findAllByRoomNoOrderByRoomImageNo(roomNo);
		
		return rows.stream().map(entity->entity.toDto()).collect(Collectors.toList());
	}

	@Override
	@Transactional
	public RoomImageDto insertRoomImage(RoomImageDto roomImageDto) {
		// 방 사진 등록
		return roomImageRepository.save(roomImageDto.toEntity()).toDto();
	}
	
}
