package org.team4p.woorizip.house.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
import org.team4p.woorizip.user.controller.UserController;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> createHouse(
			@ModelAttribute HouseDto houseDto,
			@RequestParam(value="newImages", required=false) List<MultipartFile> newImages) {
		// 건물 등록
		
		// 위도 경도 반환
		// => service 레이어에서 수행
		// 서비스에서 위도 경도 추가해서 건물 DB에 정보 등록
		HouseDto savedHouseDto = houseService.insertHouse(houseDto); 
		
		// 이미지 등록 : 이미지 파일 저장 실패하면 DB에도 등록 안됨. DB에 저장 실패하면 파일저장소에서 삭제됨
		if (savedHouseDto != null) {	// 건물 등록 성공한 경우
			// 사진 첨부 있는지 확인
			if (newImages != null && !newImages.isEmpty()) {	// 사진 있으면
				for (MultipartFile newImage : newImages) {
					String originalImageName = newImage.getOriginalFilename();
					// 파일이름변환
					if (originalImageName == null || originalImageName.isBlank()) {
//			            throw new IllegalArgumentException("원본 파일명이 없습니다.");
						continue;	//남은 파일 목록들을 계속 저장 시도하기 위해 에러발생없이 진행
			        }
					
					int index = originalImageName.lastIndexOf(".");
					if (index < 0) {
//						throw new IllegalArgumentException("확장자가 없는 파일입니다: " + originalImageName);
						continue;
					}
					String extension = originalImageName.substring(index);
					
					String storedImageName = UUID.randomUUID().toString() + extension;
					
					// 파일저장소에 저장
					File saveDir = uploadProperties.houseImageDir().toFile();
		            if (!saveDir.exists()) saveDir.mkdirs();
		            File saveFile = new File(saveDir, storedImageName);
		            try {
		                newImage.transferTo(saveFile);
		            } catch (Exception e) {
		                continue;
		            }

		            // HouseImageDto만들어서 DB에 저장
		            HouseImageDto houseImageDto = HouseImageDto.builder()
												            		.houseNo(savedHouseDto.getHouseNo())
												            		.houseOriginalImageName(originalImageName)
												            		.houseStoredImageName(storedImageName)
												            		.build();
		            try {
		            		houseImageService.insertHouseImage(houseImageDto);
		            } catch(Exception e) {
		            		// DB에 사진이름 저장 실패하면 저장소에서 파일 삭제
		            		try {
							Files.deleteIfExists(saveFile.toPath());
						} catch (IOException e2) {}
		            		continue;
		            }
				}	//for
			}	//if 사진 있는 경우
			return ResponseEntity.status(201).body(ApiResponse.ok("건물 등록 성공", null));
		}	//if 건물 등록 성공한 경우
		// 사진 없으면
		return ResponseEntity.status(201).body(ApiResponse.ok("건물 등록 성공", null));
	}

	@PutMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<Void>> modifyHouse(
			@PathVariable("houseNo") String houseNo,
			@ModelAttribute HouseDto houseDto,
			@RequestParam(value="deleteImageNos", required=false) List<Integer> deleteImageNos,
			@RequestParam(value="newImages", required=false) List<MultipartFile> newImages,
			@RequestHeader("currentUserNo") String currentUserNo/*임시*/
	){
		// 건물 정보 수정
		houseDto.setHouseNo(houseNo);
		houseService.updateHouse(houseDto, currentUserNo);
		
		// 삭제 사진 처리 : DB삭제 -> 저장소 삭제
		if(deleteImageNos != null && deleteImageNos.size() > 0) {
			for (int deleteImageNo: deleteImageNos) {
				// DB에서 삭제
				HouseImageDto ImageDto;
				try {
					ImageDto = houseImageService.deleteHouseImageByHouseImageNo(deleteImageNo, houseNo);
				} catch (Exception e) {continue;}
				// Dto로부터 사진 경로 구성
				File targetFile = new File(uploadProperties.houseImageDir().toFile(), ImageDto.getHouseStoredImageName());
				
				// 파일저장소에서 삭제
				try {
					Files.deleteIfExists(targetFile.toPath());
				} catch (IOException e) {continue;}
			}
		}
		
		// 추가 사진 처리 : 저장소 저장 -> DB저장
		if(newImages != null && newImages.size() > 0) {
			for (MultipartFile newImage : newImages) {
				String originalImageName = newImage.getOriginalFilename();
				// 파일이름변환
				if (originalImageName == null || originalImageName.isBlank()) {
//		            throw new IllegalArgumentException("원본 파일명이 없습니다.");
					continue;	//남은 파일 목록들을 계속 저장 시도하기 위해 에러발생없이 진행
		        }
				
				int index = originalImageName.lastIndexOf(".");
				if (index < 0) {
//					throw new IllegalArgumentException("확장자가 없는 파일입니다: " + originalImageName);
					continue;
				}
				String extension = originalImageName.substring(index);
				
				String storedImageName = UUID.randomUUID().toString() + extension;
				
				// 파일저장소에 저장
				File saveDir = uploadProperties.houseImageDir().toFile();
	            if (!saveDir.exists()) saveDir.mkdirs();
	            File saveFile = new File(saveDir, storedImageName);
	            try {
	                newImage.transferTo(saveFile);
	            } catch (Exception e) {
	                continue;
	            }

	            // HouseImageDto만들어서 DB에 저장
	            HouseImageDto houseImageDto = HouseImageDto.builder()
											            		.houseNo(houseNo)
											            		.houseOriginalImageName(originalImageName)
											            		.houseStoredImageName(storedImageName)
											            		.build();
	            try {
	            		houseImageService.insertHouseImage(houseImageDto);
	            } catch(Exception e) {
	            		// DB에 사진이름 저장 실패하면 저장소에서 파일 삭제
	            		try {
						Files.deleteIfExists(saveFile.toPath());
					} catch (IOException e2) {}
	            		continue;
	            }
			}
		}
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 정보 수정 성공", null));
	}
	
	@DeleteMapping("/{houseNo}")
	public ResponseEntity<ApiResponse<Void>> deleteHouse(@PathVariable("houseNo") String houseNo, @RequestHeader("currentUserNo") String currentUserNo/*임시*/){
		// 건물 소프트 삭제
		
		houseService.deleteHouse(houseNo, currentUserNo);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("건물 정보 삭제 성공", null));
	}
	
	@GetMapping("/{houseNo}/images")
	public ResponseEntity<ApiResponse<Void>> getHouseImages(String houseNo){
		// 건물 이미지 목록 조회
		
		return null;
	}
	
	
	
}
