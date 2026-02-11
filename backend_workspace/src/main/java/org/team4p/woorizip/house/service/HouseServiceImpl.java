package org.team4p.woorizip.house.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseServiceImpl implements HouseService {
	private final HouseRepository houseRepository;

	@Override
	public HouseDto selectHouses(RoomSearchCondition cond) {
		// 건물 검색 결과 조회
		return null;
	}

	@Override
	public HouseMarkerResponse selectHouseMarkers(RoomSearchCondition cond) {
		// 지도 내 건물 마커용 검색 결과 조회
		return null;
	}

	@Override
	public List<HouseDto> selectHousesByOwnerNo(String userNo) {
		// 임대인 회원 건물 목록 조회
		return null;
	}

	@Override
	public HouseDto selectHouse(String houseNo) {
		// 건물 상세 조회
		return null;
	}

	@Override
	public HouseDto insertHouse(HouseDto houseDto) {
		// 건물 등록
		return houseRepository.save(houseDto.toEntity()).toDto();
		
	}

	@Override
	public HouseDto updateHouse(HouseDto houseDto) {
		// 건물 정보 수정
		return null;
	}

	@Override
	public int deleteHouse(String houseNo) {
		// 건물 정보 삭제
		return 0;
	}
	
	

}
