package org.team4p.woorizip.house.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.house.kakaoAPI.KakaoGeocodingResponse;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseServiceImpl implements HouseService {
	private final HouseRepository houseRepository;
	private final @Qualifier("houseRestTemplate") RestTemplate houseRestTemplate;

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
		
		// 주소 -> 위도, 경도 전환
		// geocoding 요청할 URI 구성
		String uri = UriComponentsBuilder
				.fromPath("/v2/local/search/address.json")
				.queryParam("query", houseDto.getHouseAddress())
				.build(true)
				.toUriString();
		// RestTemplate 사용해서 API 응답 요청
		KakaoGeocodingResponse response = houseRestTemplate.getForObject(uri, KakaoGeocodingResponse.class);
		
		if (response == null || response.getDocuments() == null || response.getDocuments().isEmpty()) {
		    throw new IllegalArgumentException("주소를 좌표로 변환할 수 없습니다: " + houseDto.getHouseAddress());
		}
		
		double lat = Double.parseDouble(response.getDocuments().get(0).getY());
		double lng = Double.parseDouble(response.getDocuments().get(0).getX());
		houseDto.setHouseLat(lat);
		houseDto.setHouseLng(lng);
		
		// DB에 등록
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
