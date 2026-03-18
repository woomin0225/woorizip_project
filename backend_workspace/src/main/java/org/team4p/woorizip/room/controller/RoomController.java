package org.team4p.woorizip.room.controller;

import java.time.LocalDate;
import java.util.List;

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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.ReviewRankingResponse;
import org.team4p.woorizip.room.dto.response.RoomAiAnalyzeResponse;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.dto.response.ViewsRankingResponse;
import org.team4p.woorizip.room.dto.response.WishRankingResponse;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;
import org.team4p.woorizip.room.image.service.RoomImageService;
import org.team4p.woorizip.room.image.service.RoomImageSummaryService;
import org.team4p.woorizip.room.review.dto.ReviewDto;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;
import org.team4p.woorizip.room.review.service.ReviewService;
import org.team4p.woorizip.room.review.service.ReviewSummaryService;
import org.team4p.woorizip.room.service.RoomAiService;
import org.team4p.woorizip.room.service.RoomService;
import org.team4p.woorizip.room.view.service.RoomViewService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

	private final RoomService roomService;
	private final RoomImageService roomImageService;
	private final UploadProperties uploadProperties;
	private final ReviewService reviewService;
	private final RoomViewService rvService;
	private final RoomAiService roomAiService;
	private final ReviewSummaryService reviewSummaryService;
	private final RoomImageSummaryService roomImageSummaryService;
	
	@GetMapping("/search")
	public ResponseEntity<ApiResponse<Slice<RoomSearchResponse>>> searchRooms(@Valid @ModelAttribute RoomSearchCondition cond, Pageable pageable) {
		// 방 검색 결과 조회
		Slice<RoomSearchResponse> slice = roomService.selectRoomSearch(cond, pageable);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("검색 성공", slice));
	}
	
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<Void>> createRoom(
			@RequestParam("houseNo") String houseNo,
			@Valid @ModelAttribute RoomDto roomDto,
			@RequestPart(value="newImages", required=false) List<MultipartFile> newImages,
			Authentication auth
			) {
		// 방 등록
		roomDto.setHouseNo(houseNo);
		log.info("houseNo={}", houseNo);
		roomDto.setRoomNo(null);
		
		String currentUser = auth.getName().toString();
		RoomDto savedRoomDto = roomService.insertRoom(roomDto, currentUser); 
		
		// 이미지 등록 : 이미지 파일 저장 실패하면 DB에도 등록 안됨. DB에 저장 실패하면 파일저장소에서 삭제됨
		// 사진 첨부 있는지 확인
		if (newImages != null && !newImages.isEmpty()) {	// 사진 있으면
			int imageCount = roomImageService.insertRoomImage(newImages, savedRoomDto.getRoomNo());
			
			// 사진 갯수 반영
			roomService.updateRoomImageCount(savedRoomDto.getRoomNo(), imageCount);
		}
		
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

	@GetMapping("/{roomNo}/edit")
	public ResponseEntity<ApiResponse<RoomDto>> getRoomForEdit(@PathVariable("roomNo") String roomNo){
		// 방 상세 조회(편집용)
		RoomDto room = roomService.selectRoomForEdit(roomNo);
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
			@RequestPart(value="newImages", required=false) List<MultipartFile> newImages,
			Authentication auth
			){
		
		// 방 정보 수정
		roomDto.setRoomNo(roomNo);
		String currentUser = auth.getName().toString();
		roomService.updateRoom(roomDto, currentUser);
		
		int prevCount = roomImageService.countRoomImageNumber(roomNo);
		
		// 삭제 사진 처리 : DB삭제 -> 저장소 삭제
		int deleteCount = 0;
		if(deleteImageNos != null && deleteImageNos.size() > 0) {
			for (int deleteImageNo: deleteImageNos) {
				deleteCount = roomImageService.deleteRoomImageByRoomImageNo(deleteImageNos, roomNo);
			}
		}
		
		// 추가 사진 처리 : 저장소 저장 -> DB저장
		int addCount = 0;
		if(newImages != null && newImages.size() > 0) {
			addCount = roomImageService.insertRoomImage(newImages, roomNo);
		}
		
		// 사진 갯수 반영
		int count = roomImageService.countRoomImageNumber(roomNo);	//기존 갯수
		if(count == prevCount - deleteCount + addCount) {
			roomService.updateRoomImageCount(roomNo, count);	//기존 갯수 - 삭제 갯수 - 추가 갯수
		}
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 정보 수정 성공", null));
	}
	
	@PostMapping("/{roomNo}/reviews")
	public ResponseEntity<ApiResponse<Void>> createRoomReview(@PathVariable("roomNo") String roomNo, @Valid @RequestBody ReviewDto reviewDto, Authentication auth){
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
	public ResponseEntity<ApiResponse<Void>> modifyRoomAvailability(@PathVariable String roomNo,@RequestBody LocalDate date, Authentication auth){
		// 방 입주 가능 일자 변경
		
		String currentUser = auth.getName().toString();
		roomService.updateRoomAvailability(roomNo, date, currentUser);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("입주일자 변경 완료", null));
	}
	
	@PatchMapping("/{roomNo}/emptyyn")
	public ResponseEntity<ApiResponse<Void>> modifyRoomEmptyYn(@PathVariable String roomNo, Authentication auth){
		// 방 공실 여부 변경
		
		String currentUser = auth.getName().toString();
		roomService.updateRoomEmptyYn(roomNo, currentUser);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("공실여부 변경 완료", null));
	}
	
	private int parseHours(String period) {
		if(period.startsWith("DAY")) return Integer.parseInt(period.substring(3))*24;
		
		return 7*24;
	}

	@GetMapping("/view/popular")
	public ResponseEntity<ApiResponse<List<ViewsRankingResponse>>> getViewsRankingOfRooms(
			@RequestParam(name="period", defaultValue = "DAY1") String period,
			@RequestParam(name="limit", defaultValue = "10") Integer limit
			) {
		int hours = parseHours(period);
		List<ViewsRankingResponse> list = roomService.selectPopularRoomsLastHours(hours, limit);
		return ResponseEntity.status(200).body(ApiResponse.ok("조회수기준 랭킹 조회 완료("+period+"일,"+limit+"개)", list));
	}
	
	@GetMapping("/review/popular")
	public ResponseEntity<ApiResponse<List<ReviewRankingResponse>>> getReviewRanking(@RequestParam("period") String period, @RequestParam("limit") Integer limit){
		// 리뷰 많은 순 방 목록 조회, period일 동안, limit개 조회함
		int hours = parseHours(period);
		List<ReviewRankingResponse> list = roomService.selectTopNByRating(hours, limit);
		return ResponseEntity.status(200).body(ApiResponse.ok("리뷰평균기준 랭킹 조회 완료("+period+"일,"+limit+"개)", list));
	}
	
	@GetMapping("/wish/popular")
	public ResponseEntity<ApiResponse<List<WishRankingResponse>>> getWishRanking(@RequestParam("limit") Integer limit){
		// 위시 많은 순 방 목록 조회, limit개 조회함
		List<WishRankingResponse> list = roomService.selectTopNByWish(limit);
		return ResponseEntity.status(200).body(ApiResponse.ok("위시갯수기준 랭킹 조회 완료("+limit+"개)", list));
	}
	
	@PostMapping(value = "/ai/analyze/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<RoomAiAnalyzeResponse>> analyzeRoomImages(
			@RequestPart("images") List<MultipartFile> images
			) {
		RoomAiAnalyzeResponse result = roomAiService.analyzeRoomImages(images);
		return ResponseEntity.status(200).body(ApiResponse.ok("방 이미지 AI 분석 성공", result));
	}

	@PostMapping("/rag/room")
	public ResponseEntity<ApiResponse<List<RoomDto>>> ragSearchRooms(@RequestBody String text){		
		List<RoomDto> list = roomService.selectRoomRag(text);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 rag 검색 성공", list));
	}
	
	@GetMapping("/{roomNo}/summarized_review")
	public ResponseEntity<ApiResponse<ReviewSummaryEntity>> callSummarizedReviews(@PathVariable("roomNo") String roomNo){
		var result = reviewSummaryService.selectSummarizedReview(roomNo);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 리뷰 요약 결과 불러오기 성공", result)); 
	}
	
	@GetMapping("/{roomNo}/summarized_image")
	public ResponseEntity<ApiResponse<RoomImageSummaryEntity>> callSummarizedImageCaptions(@PathVariable("roomNo") String roomNo){
		var result = roomImageSummaryService.selectSummarizedImageCaption(roomNo);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 사진분석 요약 결과 불러오기 성공", result));
	}
	
	@GetMapping("/{roomNo}/summarized_room")
	public ResponseEntity<ApiResponse<String>> callSummarizedRoom(@PathVariable("roomNo") String roomNo){
		String result = roomAiService.selectSummarizedRoom(roomNo);
		
		return ResponseEntity.status(200).body(ApiResponse.ok("방 종합 요약 결과 불러오기 성공", result));
	}
}
