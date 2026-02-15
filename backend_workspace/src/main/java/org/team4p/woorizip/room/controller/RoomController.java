package org.team4p.woorizip.room.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.image.dto.HouseImageDto;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.service.RoomImageService;
import org.team4p.woorizip.room.service.RoomService;
import org.team4p.woorizip.room.type.SearchCriterion;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {
	private final RoomService roomService;
	private final RoomImageService roomImageService;
	private final UploadProperties uploadProperties;
	
	@GetMapping("/search")
	public ResponseEntity<ApiResponse<Slice<RoomSearchResponse>>> searchRooms(@ModelAttribute RoomSearchCondition cond, Pageable pageable, @RequestParam SearchCriterion criterion) {
		// 방 검색 결과 조회
		Slice<RoomSearchResponse> slice = roomService.selectRoomSearch(cond, pageable, criterion);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("검색 성공", slice));
	}
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> createRoom(
			@ModelAttribute RoomDto roomDto,
			@RequestParam(value="newImages", required=false) List<MultipartFile> newImages,
			@RequestHeader("currentUserNo") String currentUserNo/*임시*/
			) {
		// 방 등록
		
		RoomDto savedRoomDto = roomService.insertRoom(roomDto, currentUserNo); 
		
		// 이미지 등록 : 이미지 파일 저장 실패하면 DB에도 등록 안됨. DB에 저장 실패하면 파일저장소에서 삭제됨
		if (savedRoomDto != null) {	// 건물 등록 성공한 경우
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
					File saveDir = uploadProperties.roomImageDir().toFile();
		            if (!saveDir.exists()) saveDir.mkdirs();
		            File saveFile = new File(saveDir, storedImageName);
		            try {
		                newImage.transferTo(saveFile);
		            } catch (Exception e) {
		                continue;
		            }

		            // RoomImageDto만들어서 DB에 저장
		            RoomImageDto roomImageDto = RoomImageDto.builder()
												            		.roomNo(savedRoomDto.getRoomNo())
												            		.roomOriginalImageName(originalImageName)
												            		.roomStoredImageName(storedImageName)
												            		.build();
		            try {
		            		roomImageService.insertRoomImage(roomImageDto);
		            } catch(Exception e) {
		            		// DB에 사진이름 저장 실패하면 저장소에서 파일 삭제
		            		try {
							Files.deleteIfExists(saveFile.toPath());
						} catch (IOException e2) {}
		            		continue;
		            }
				}	//for
			}	//if 사진 있는 경우
			return ResponseEntity.status(201).body(ApiResponse.ok("방 등록 성공", null));
		}	//if 건물 등록 성공한 경우
		// 사진 없으면
		return ResponseEntity.status(201).body(ApiResponse.ok("방 등록 성공", null));
	}
	
	@DeleteMapping("/{roomNo}")
	public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable("roomNo") String roomNo, @RequestHeader("currentUserNo") String currentUserNo/*임시*/){
		// 방 소프트 삭제
		
		roomService.deleteRoom(roomNo, currentUserNo);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 정보 삭제 성공", null));
	}
}
