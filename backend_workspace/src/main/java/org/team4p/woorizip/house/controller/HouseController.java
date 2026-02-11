package org.team4p.woorizip.house.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

@RestController
@RequestMapping("/houses")
public class HouseController {
	
	@GetMapping("/search")
	public ResponseEntity<ApiResponse<HouseDto>> searchHouses(RoomSearchCondition roomSearchCondition){
		// 건물 검색 결과 조회
		
		return null;
	}
	
	@GetMapping("/marker")
	public ResponseEntity<ApiResponse<List<HouseMarkerResponse>>> getHouseMarkers(RoomSearchCondition roomSearchCondition){
		// 지도 내 건물 마커용 검색 결과 조회
		
		return null;
	}
	
	@GetMapping("/owner")
	public ResponseEntity<ApiResponse<List<HouseDto>>> getMyHouses(String userNo) {
		// 임대인 회원 건물 목록 조회
		
		return null;
	}
	
	@GetMapping("/{houseNo}/rooms")
	public ResponseEntity<ApiResponse<List<RoomDto>>> getRoomByHouseNo(String houseNo){
		// 건물 내 방 목록 조회
		
		return null;
	}
	
	@GetMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<HouseDto>> getHouse(String houseNo){
		// 건물 상세 조회
		
		return null;
	}
	
	@PostMapping
	public ResponseEntity<ApiResponse<Void>> createHouse(HouseDto houseDto, List<MultipartFile> newImages){
		// 건물 등록
		
		return ResponseEntity.status(201).body(ApiResponse.ok("건물 등록 성공", null));
	}

	@PutMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<Void>> modifyHouse(HouseDto houseDto, List<Integer> deleteImageNos, List<MultipartFile> newImages){
		// 건물 정보 수정
		
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 정보 수정 성공", null));
	}
	
	@DeleteMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<Void>> deleteHouse(String houseNo){
		// 건물 삭제
		
		return null;
	}
	
	@GetMapping("/{houseNo}/images")
	public ResponseEntity<ApiResponse<Void>> getHouseImages(String houseNo){
		// 건물 이미지 목록 조회
		
		return null;
	}
	
	
	
}
