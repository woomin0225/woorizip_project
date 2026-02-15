package org.team4p.woorizip.room.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.service.RoomImageService;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.type.SearchCriterion;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {
	private final RoomRepository roomRepository;
	private final RoomImageService roomImageService;
	
	@Override
	public Slice<RoomSearchResponse> selectRoomSearch(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion) {
		// 방 검색
		
		// bbox 좌표 크기순서 보증
		cond.adjustment();
		
		// 방 검색 결과 조회 -> 응답객체에 저장
		Slice<RoomSearchResponse> slice = roomRepository.searchRooms(cond, pageable, criterion)
				.map((entity)->RoomSearchResponse.builder()
								.roomNo(entity.getRoomNo())
								.roomName(entity.getRoomName())
								.roomUpdatedAt(entity.getRoomUpdatedAt())
								.roomDeposit(entity.getRoomDeposit())
								.roomMonthly(entity.getRoomMonthly())
								.roomMethod(entity.getRoomMethod())
								.roomArea(entity.getRoomArea())
								.roomFacing(entity.getRoomFacing())
								.roomRoomCount(entity.getRoomRoomCount())
								.roomEmptyYn(entity.getRoomEmptyYn())
								.roomImageCount(entity.getRoomImageCount())
								.build()
		);
		
		// 사진 조회 -> 이름 추출 -> 응답에 저장
		for (RoomSearchResponse item : slice.getContent()) {
			List<RoomImageDto> images = roomImageService.selectRoomImages(item.getRoomNo());
			if(!images.isEmpty()) { 
				List<String> names = new ArrayList<>();
				for(RoomImageDto image : images) {
					names.add(image.getRoomStoredImageName());
				}
				item.setImageNames(names);
			}
		}
		
		return slice;
	}

	@Override
	@Transactional
	public RoomDto insertRoom(RoomDto roomDto) {
		// 방 등록
		return roomRepository.save(roomDto.toEntity()).toDto();
	}

}
