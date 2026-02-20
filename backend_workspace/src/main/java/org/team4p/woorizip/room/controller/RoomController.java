package org.team4p.woorizip.room.controller;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.service.RoomImageService;
import org.team4p.woorizip.room.review.dto.ReviewDto;
import org.team4p.woorizip.room.review.service.ReviewService;
import org.team4p.woorizip.room.service.RoomService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {
	private final RoomService roomService;
	private final RoomImageService roomImageService;
	private final UploadProperties uploadProperties;
	private final ReviewService reviewService;
	
	@GetMapping("/search")
	public ResponseEntity<ApiResponse<Slice<RoomSearchResponse>>> searchRooms(@Valid @ModelAttribute RoomSearchCondition cond, Pageable pageable) {
		// 방 검색 결과 조회
		Slice<RoomSearchResponse> slice = roomService.selectRoomSearch(cond, pageable);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("검색 성공", slice));
	}
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> createRoom(
			@Valid @RequestBody RoomDto roomDto,
			@RequestParam(value="newImages", required=false) List<MultipartFile> newImages,
			Authentication auth
			) {
		// 방 등록
		
		String currentUser = auth.getName().toString();
		RoomDto savedRoomDto = roomService.insertRoom(roomDto, currentUser); 
		
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
	public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable("roomNo") String roomNo, Authentication auth){
		// 방 소프트 삭제
		String currentUser = auth.getName().toString();
		roomService.deleteRoom(roomNo, currentUser);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 정보 삭제 성공", null));
	}
	
	@GetMapping("/{roomNo}")
	public ResponseEntity<ApiResponse<RoomDto>> getRoom(@PathVariable("roomNo") String roomNo){
		// 방 상세 조회
		RoomDto room = roomService.selectRoom(roomNo);
		return ResponseEntity.status(200).body(ApiResponse.ok("방 목록 조회 성공", room));
	}
	
	@GetMapping("/{roomNo}/images")
	public ResponseEntity<ApiResponse<List<RoomImageDto>>> getRoomImages(@PathVariable("roomNo") String roomNo) {
		// 방 상세 이미지 조회
		List<RoomImageDto> imageList = roomImageService.selectRoomImages(roomNo); 
		return ResponseEntity.status(200).body(ApiResponse.ok("방 사진 목록 조회 성공", imageList));
	}
	
	@GetMapping("/{roomNo}/reviews")
	public ResponseEntity<ApiResponse<Page<ReviewDto>>> getRoomReviews(@PathVariable("roomNo") String roomNo, Pageable pageable){
		// 방 상세 리뷰 조회 (페이징 처리)
		Page<ReviewDto> reviewPage = reviewService.selectRoomReviews(roomNo, pageable);
		return ResponseEntity.status(200).body(ApiResponse.ok("방 리뷰 목록 조회 성공", reviewPage));
	}
	
	@PutMapping("/{roomNo}")
	public ResponseEntity<ApiResponse<Void>> modifyRoom(
			@PathVariable("roomNo") String roomNo,
			@Valid @ModelAttribute RoomDto roomDto,
			@RequestParam(value="deleteImageNos", required=false) List<Integer> deleteImageNos,
			@RequestParam(value="newImages", required=false) List<MultipartFile> newImages,
			Authentication auth
			){
		
		// 방 정보 수정
		roomDto.setRoomNo(roomNo);
		String currentUser = auth.getName().toString();
		roomService.updateRoom(roomDto, currentUser);
		
		// 삭제 사진 처리 : DB삭제 -> 저장소 삭제
		if(deleteImageNos != null && deleteImageNos.size() > 0) {
			for (int deleteImageNo: deleteImageNos) {
				// DB에서 삭제
				RoomImageDto ImageDto;
				try {
					ImageDto = roomImageService.deleteRoomImageByRoomImageNo(deleteImageNo, roomNo);
				} catch (Exception e) {continue;}
				// Dto로부터 사진 경로 구성
				File targetFile = new File(uploadProperties.roomImageDir().toFile(), ImageDto.getRoomStoredImageName());
				
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
											            		.roomNo(roomNo)
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
			}
		}
		return ResponseEntity.status(200).body(ApiResponse.ok("방 정보 수정 성공", null));
	}
	
	@PostMapping("/{roomNo}/reviews")
	public ResponseEntity<ApiResponse<Void>> createRoomReview(@Valid @RequestBody ReviewDto reviewDto, @PathVariable("roomNo") String roomNo, Authentication auth){
		// 방 리뷰 등록
		reviewDto.setRoomNo(roomNo);
		
		String currentUser = auth.getName().toString();
		
		reviewService.insertRoomReview(reviewDto, currentUser);
		
		return ResponseEntity.status(201).body(ApiResponse.ok("리뷰 등록 성공", null));
	}
	
	@DeleteMapping("/{roomNo}/reviews/{reviewNo}")
	public ResponseEntity<ApiResponse<Void>> deleteRoomReview(
			@PathVariable("roomNo") String roomNo,
			@PathVariable("reviewNo") int reviewNo,
			Authentication auth
			){
		// 방 리뷰 삭제
		
		String currentUser = auth.getName().toString();
		reviewService.deleteRoomReview(reviewNo, currentUser);
		return ResponseEntity.status(200).body(ApiResponse.ok("리뷰 삭제 성공", null));
	}
	
	@PutMapping("/{roomNo}/reviews/{reviewNo}")
	public ResponseEntity<ApiResponse<Void>> ModifyRoomReview(
			@PathVariable("roomNo") String roomNo,
			@PathVariable("reviewNo") int reviewNo,
			@Valid @RequestBody ReviewDto reviewDto,
			Authentication auth
			){
		// 방 리뷰 수정
		
		String currentUser = auth.getName().toString();
		reviewDto.setReviewNo(reviewNo);
		reviewDto.setRoomNo(roomNo);
		reviewService.updateRoomReview(reviewDto, currentUser);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("리뷰 수정 성공", null));
	}
	
	@PatchMapping("/{roomNo}/availability")
	public ResponseEntity<ApiResponse<Void>> modifyRoomAvailability(@PathVariable String roomNo,@RequestBody LocalDateTime date, Authentication auth){
		// 방 입주 가능 일자 변경
		
		String currentUser = auth.getName().toString();
		roomService.updateRoomAvailability(roomNo, date, currentUser);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("입주일자 변경 완료", null));
	}
}
