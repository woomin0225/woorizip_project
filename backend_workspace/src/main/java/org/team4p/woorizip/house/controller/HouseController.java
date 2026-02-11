package org.team4p.woorizip.house.controller;

import java.io.File;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.house.image.dto.HouseImageDto;
import org.team4p.woorizip.house.image.service.HouseImageService;
import org.team4p.woorizip.house.service.HouseService;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/houses")
@RequiredArgsConstructor
public class HouseController {
	private final HouseService houseService;
	private final HouseImageService houseImageService;
	private final UploadProperties uploadProperties;
	
	
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
	public ResponseEntity<ApiResponse<Void>> createHouse(@ModelAttribute HouseDto houseDto, List<MultipartFile> newImages){
		// 건물 등록
		// 위도 경도 가져오기
		
		HouseDto savedHouseDto =houseService.insertHouse(houseDto); 
		if (savedHouseDto != null) {	// 건물 등록 성공한 경우
			// 사진 첨부 있는지 확인
			if (!newImages.isEmpty() && newImages != null) {	// 사진 있으면
				for (MultipartFile newImage : newImages) {
					String originalImageName = newImage.getOriginalFilename();
					// 파일이름변환
					if (originalImageName == null || originalImageName.isBlank()) {
			            throw new IllegalArgumentException("원본 파일명이 없습니다.");
			        }
					int index = originalImageName.lastIndexOf(".");
					String extension = originalImageName.substring(index);
					String storedImageName = UUID.randomUUID().toString() + extension;
					
					// 파일저장소에 저장
					File saveDir = uploadProperties.houseImageDir().toFile();
		            if (!saveDir.exists()) saveDir.mkdirs();

		            try {
		                newImage.transferTo(new File(saveDir, storedImageName));
		            } catch (Exception e) {
//		                log.error("첨부파일 저장 실패", e);
		                return ResponseEntity.status(500).body(ApiResponse.fail("첨부파일 저장 실패", null));
		            }

		            // HouseImageDto만들어서 DB에 저장
		            HouseImageDto houseImageDto = HouseImageDto.builder().houseNo(savedHouseDto.getHouseNo()).houseOriginalImageName(originalImageName).houseStoredImageName(storedImageName).build();
		            
					HouseImageDto savedImageDto = houseImageService.insertHouseImage(houseImageDto);
					
					// ok 받아서 201 created 반환
					if (savedImageDto != null) {
						return ResponseEntity.status(201).body(ApiResponse.ok("건물 등록 성공", null));
					}else {
						return ResponseEntity.status(400).body(ApiResponse.ok("건물 등록 실패", null));
					}
				
				}	//for
			}	//if
			
		}
		// 사진 없으면
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
