package org.team4p.woorizip.room.image.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;
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

	@Override
	@Transactional
	public RoomImageDto deleteRoomImageByRoomImageNo(int deleteImageNo, String currentRoomNo) {
		// 방 이미지 삭제
		// 건물사진번호로 방사진 엔티티 반환
		Optional<RoomImageEntity> OptionalEntity = roomImageRepository.findById(deleteImageNo);
		if(!OptionalEntity.isPresent()) throw new NotFoundException("해당 번호의 사진을 찾을 수 없습니다.");
		if(!OptionalEntity.get().getRoomNo().equals(currentRoomNo)) throw new IllegalArgumentException("해당 건물의 사진이 아닙니다.");
		
		roomImageRepository.deleteById(deleteImageNo);
		
		return OptionalEntity.get().toDto();
	}

	@Override
	@Transactional
	public void deleteRoomImagesAll(String roomNo) {
		// 방 이미지 전부 삭제
		List<RoomImageEntity> rows = roomImageRepository.findAllByRoomNoOrderByRoomImageNo(roomNo);
		for(RoomImageEntity entity:rows) {
			roomImageRepository.deleteById(entity.getRoomImageNo());
		}
	}
	
}
