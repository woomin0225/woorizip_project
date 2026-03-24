package org.team4p.woorizip.house.controller;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.house.dto.response.ViewRankingResponse;
import org.team4p.woorizip.house.image.dto.HouseImageDto;
import org.team4p.woorizip.house.image.service.HouseImageService;
import org.team4p.woorizip.house.service.HouseService;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.service.RoomService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/houses")
@RequiredArgsConstructor
public class HouseController {
	private final HouseService houseService;
	private final HouseImageService houseImageService;
	private final UploadProperties uploadProperties;
	private final RoomService roomService;
	
	@GetMapping("/marker")
	public ResponseEntity<ApiResponse<List<HouseMarkerResponse>>> getHouseMarkers(@Valid @ModelAttribute RoomSearchCondition roomSearchCondition){
		// 지도 내 건물 마커용 검색 결과 조회
		
		List<HouseMarkerResponse> list = houseService.selectHouseMarkers(roomSearchCondition);
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 마커 조회 성공", list));
	}
	
	@GetMapping("/owner")
	public ResponseEntity<ApiResponse<List<HouseDto>>> getMyHouses(
			@RequestParam(name = "targetUserNo", required = false) String targetUserNo,
			Authentication auth) {
		// 임대인 회원 건물 목록 조회
		
		String currentUser = auth.getName().toString();
		List<HouseDto> list = houseService.selectHousesByOwnerNo(currentUser, targetUserNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("회원의 건물 목록 조회 성공", list));
	}
	
	@GetMapping("/{houseNo}/rooms")
	public ResponseEntity<ApiResponse<List<RoomDto>>> getRoomByHouseNo(@PathVariable("houseNo") String houseNo){
		// 건물 내 방 목록 조회
		List<RoomDto> roomList = roomService.selectRoomsByHouseNo(houseNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 내 방 목록 조회 성공", roomList));
	}
	
	@GetMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<HouseDto>> getHouse(@PathVariable("houseNo") String houseNo){
		// 건물 상세 조회
		HouseDto house = houseService.selectHouse(houseNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 상세 조회 성공", house));
	}

	@GetMapping("/{houseNo}/edit")
	public ResponseEntity<ApiResponse<HouseDto>> getHouseForEdit(@PathVariable("houseNo") String houseNo){
		// 건물 상세 조회
		HouseDto house = houseService.selectHouseForEdit(houseNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 상세 조회 성공", house));
	}
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> createHouse(
			@Valid @ModelAttribute HouseDto houseDto,
			@RequestPart(value="newImages", required=false) List<MultipartFile> newImages,
			Authentication auth) {
		// 건물 등록
		houseDto.setHouseNo(null);
		
		// 위도 경도 반환
		// => service 레이어에서 수행
		// 서비스에서 위도 경도 추가해서 건물 DB에 정보 등록
		String currentUser = auth.getName().toString();
		HouseDto savedHouseDto = houseService.insertHouse(houseDto, currentUser); 
		
		// 사진 첨부 있는지 확인
		if (newImages != null && !newImages.isEmpty()) {	// 사진 있으면
			int imageCount = houseImageService.insertHouseImage(newImages, savedHouseDto.getHouseNo());	// 내부에서 파일 리스트 반복 처리
			
			// 사진 갯수 반영
			houseService.updateHouseImageCount(savedHouseDto.getHouseNo(), imageCount);
		}
		
		return ResponseEntity.status(201).body(ApiResponse.ok("건물 등록 성공", null));
	}

	@PutMapping(value = "/{houseNo}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> modifyHouse(
			@PathVariable("houseNo") String houseNo,
			@Valid @ModelAttribute HouseDto houseDto,
			@RequestParam(value="deleteImageNos", required=false) List<Integer> deleteImageNos,
			@RequestPart(value="newImages", required=false) List<MultipartFile> newImages,
			Authentication auth
	){
		// 건물 정보 수정
		houseDto.setHouseNo(houseNo);
		String currentUser = auth.getName().toString();
		houseService.updateHouse(houseDto, currentUser);
		
		// 삭제 사진 처리 : DB삭제 -> 저장소 삭제
		int deleteCount = 0;
		if(deleteImageNos != null && deleteImageNos.size() > 0) {
			deleteCount = houseImageService.deleteHouseImageByHouseImageNo(deleteImageNos, houseNo);
		}
		
		// 추가 사진 처리 : 저장소 저장 -> DB저장
		int addCount = 0;
		if(newImages != null && newImages.size() > 0) {
			addCount = houseImageService.insertHouseImage(newImages, houseNo);
		}
		
		// 사진 갯수 반영
		int count = houseImageService.countHouseImageNumber(houseNo);	//기존 갯수
		houseService.updateHouseImageCount(houseNo, (count-deleteCount+addCount));	//기존 갯수 - 삭제 갯수 - 추가 갯수
		
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 정보 수정 성공", null));
	}
	
	@DeleteMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<Void>> deleteHouse(@PathVariable("houseNo") String houseNo, Authentication auth){
		// 건물 소프트 삭제
		
		String currentUser = auth.getName().toString();
		houseService.deleteHouse(houseNo, currentUser);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 정보 삭제 성공", null));
	}
	
	@GetMapping("/{houseNo}/images")
	public ResponseEntity<ApiResponse<List<HouseImageDto>>> getHouseImages(@PathVariable("houseNo") String houseNo){
		// 건물 이미지 목록 조회
		List<HouseImageDto> imageList = houseImageService.selectHouseImages(houseNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 이미지 목록 조회 성공", imageList));
	}
	
	@GetMapping("/{houseNo}/search")
	public ResponseEntity<ApiResponse<Slice<RoomSearchResponse>>> getRoomsInHouseMarker(
			@PathVariable("houseNo") String houseNo,
			@Valid @ModelAttribute RoomSearchCondition cond,
			Pageable pageable
			) {
		// 건물 마커 클릭시 리스트 조회
		
		Slice<RoomSearchResponse> slice = roomService.selectRoomsInHouseMarker(cond, pageable, houseNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("건물마커 내 방 목록 조회 성공", slice));
	}
	
	
	private int parseHours(String period) {
		if(period.startsWith("DAY")) return Integer.parseInt(period.substring(3))*24;
		
		return 7*24;
	}

	@GetMapping("/view/popular")
	public List<ViewRankingResponse> getPopularHouses(
			@RequestParam(name="period", defaultValue = "DAY1") String period,
			@RequestParam(name="limit", defaultValue = "10") Integer limit
			) {
		int hours = parseHours(period);
		return houseService.selectPopularHousesLastHours(hours, limit);
	}
}
