package org.team4p.woorizip.room.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.service.RoomImageService;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.type.SearchCriterion;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {
	private final RoomRepository roomRepository;
	private final RoomImageService roomImageService;
	private final HouseRepository houseRepository;
	private final UserRepository userRepository;
	
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
	public RoomDto insertRoom(RoomDto roomDto, String currentUser) {
		// 방 등록
		
		// 등록하려는 건물이 실제로 있는지 검사
		if(houseRepository.existsById(roomDto.getHouseNo()) == false) throw new IllegalArgumentException("건물을 조회할 수 없습니다.");
		
		// 해당 유저의 건물 소유권이 있는지 확인
		if(!houseRepository.findUserNoById(roomDto.getHouseNo()).equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("해당 건물에 대한 등록 권한이 없습니다.");
		
		return roomRepository.save(roomDto.toEntity()).toDto();
	}

	@Override
	@Transactional
	public void deleteRoom(String roomNo, String currentUser) {
		// 방 정보 삭제
		
		// 방 있는지 검사
		Optional<RoomEntity> gettedRoom = roomRepository.findById(roomNo);
		if(!gettedRoom.isPresent()) throw new NotFoundException("해당 방이 없습니다.");
		
		// 방 있으면 소유권 검사 
		// 로그인한 유저와 gettedOwner 비교
		if(!gettedRoom.get().getUserNo().equals(userRepository.findUserNoByEmailId(currentUser))) {
			throw new ForbiddenException("삭제 권한이 없습니다.");
		}
		
		// 소유권 검사 통과하면 방 소프트삭제 수행
		long roomResult = roomRepository.softDeleteByRoomNo(roomNo);
		if (roomResult != 1L) throw new IllegalStateException("방 정보 삭제 실패");
	}

	@Override
	public RoomDto selectRoom(String roomNo) {
		// 방 상세 조회
		Optional<RoomEntity> optional = roomRepository.findById(roomNo);
		if(!optional.isPresent()) throw new NotFoundException("해당 방을 조회할 수 없습니다.");
		RoomEntity roomEntity = optional.get();
		if(roomEntity == null) throw new NotFoundException("해당 방을 조회할 수 없습니다.");
		RoomDto roomDto = roomEntity.toDto();
		return roomDto;
	}

	@Override
	public List<RoomDto> selectRoomsByHouseNo(String houseNo) {
		// 건물 내 방 목록 조회
		List<RoomEntity> rows = roomRepository.findAllByHouseNo(houseNo);
		List<RoomDto> list = new ArrayList<>();
		rows.forEach(entity->list.add(entity.toDto()));
		return list;
	}

	@Override
	@Transactional
	public RoomDto updateRoom(RoomDto roomDto, String currentUser) {
		// 방 정보 수정
		
		// 소유권 검사
		String userNo = roomRepository.findUserNoById(roomDto.getRoomNo());
		if (!userNo.equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("수정 권한이 없습니다.");
		
		return roomRepository.save(roomDto.toEntity()).toDto();
	}

	@Override
	@Transactional
	public RoomDto updateRoomAvailability(String roomNo, LocalDateTime date, String currentUser) {
		// 방 입주가능 일자 변경
		
		// 해당 방 조회
		Optional<RoomEntity> optional = roomRepository.findById(roomNo);
		if(!optional.isPresent()) throw new NotFoundException("존재하지 않는 방입니다.");
		
		RoomEntity roomEntity = optional.get();
		
		roomEntity.setRoomAvailableDate(date);
		
		// 소유권 검사
		if(!roomEntity.getUserNo().equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("입주일자 변경 가능 권한이 없습니다.");
		
		return roomRepository.save(roomEntity).toDto();
	}

	@Override
	public Slice<RoomSearchResponse> selectRoomsInHouseMarker(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion, String houseNo) {
		// 건물 마커 클릭시 리스트 조회
		
		// bbox 좌표 크기순서 보증
		cond.adjustment();
		
		// 방 검색 결과 조회 -> 응답객체에 저장
		Slice<RoomSearchResponse> slice = roomRepository.searchRooms(cond, pageable, criterion, houseNo)
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

}
