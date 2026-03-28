package org.team4p.woorizip.room.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.ai.RoomRagResponse;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.dto.response.ReviewRankingResponse;
import org.team4p.woorizip.room.dto.response.RoomSearchResponse;
import org.team4p.woorizip.room.dto.response.RoomSearchSliceResponse;
import org.team4p.woorizip.room.dto.response.ViewsRankingResponse;
import org.team4p.woorizip.room.dto.response.WishRankingResponse;
import org.team4p.woorizip.room.image.dto.RoomImageDto;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageRepository;
import org.team4p.woorizip.room.image.service.RoomImageService;
import org.team4p.woorizip.room.jpa.entity.RoomEmbeddingEntity;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomEmbeddingRepository;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.review.jpa.repository.ReviewRepository;
import org.team4p.woorizip.room.view.jpa.repository.RoomViewRepository;
import org.team4p.woorizip.room.view.service.RoomViewService;
import org.team4p.woorizip.user.jpa.repository.UserRepository;
import org.team4p.woorizip.wishlist.jpa.repository.WishlistRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {
	private final RoomRepository roomRepository;
	private final RoomImageService roomImageService;
	private final HouseRepository houseRepository;
	private final UserRepository userRepository;
	private final RoomViewService rvService;
	private final RoomViewRepository rvRepository;
	private final RoomImageRepository riRepository;
	private final ReviewRepository reviewRepository;
	private final WishlistRepository wishlistRepository;
	private final RoomEmbeddingRepository roomEmbeddingRepository;
	private final RoomAvailabilityPolicyService roomAvailabilityPolicyService;
	
	private final WebClient.Builder webClientBuilder;
	@Value("${ai.server.base-url}")
	private String aiServerUri;
	
	@Override
	public RoomSearchSliceResponse selectRoomSearch(RoomSearchCondition cond, Pageable pageable) {
		// 방 검색
		
		// bbox 좌표 크기순서 보증
		cond.adjustment();
		long totalCount = roomRepository.countSearchRooms(cond);
		
		// 방 검색 결과 조회 -> 응답객체에 저장
		Slice<RoomSearchResponse> slice = roomRepository.searchRooms(cond, pageable)
				.map((entity)->RoomSearchResponse.builder()
								.roomNo(entity.getRoomNo())
								.roomName(entity.getRoomName())
								.houseNo(entity.getHouseNo())
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

		for (RoomSearchResponse item : slice.getContent()) {
			applyAvailability(item, item.getRoomNo(), null, item.getRoomEmptyYn());
		}
		
		// 주소 추가
		for (RoomSearchResponse item : slice.getContent()) {
			HouseEntity house = houseRepository.findById(item.getHouseNo()).get();
			String name = house.getHouseName();
			String address = house.getHouseAddress();
			item.setHouseName(name);
			item.setHouseAddress(address);
		}
		
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
		
		return RoomSearchSliceResponse.from(slice, totalCount);
	}

	private RoomSearchResponse toRoomSearchResponse(RoomEntity entity) {
		return RoomSearchResponse.builder()
				.roomNo(entity.getRoomNo())
				.roomName(entity.getRoomName())
				.houseNo(entity.getHouseNo())
				.roomUpdatedAt(entity.getRoomUpdatedAt())
				.roomDeposit(entity.getRoomDeposit())
				.roomMonthly(entity.getRoomMonthly())
				.roomMethod(entity.getRoomMethod())
				.roomArea(entity.getRoomArea())
				.roomFacing(entity.getRoomFacing())
				.roomRoomCount(entity.getRoomRoomCount())
				.roomEmptyYn(entity.getRoomEmptyYn())
				.roomImageCount(entity.getRoomImageCount())
				.build();
	}

	@Override
	@Transactional
	public RoomDto insertRoom(RoomDto roomDto, String currentUser) {
		// 방 등록
		
		// 등록하려는 건물이 실제로 있는지 검사
		if(houseRepository.existsById(roomDto.getHouseNo()) == false) throw new IllegalArgumentException("건물을 조회할 수 없습니다.");
		
		// 해당 유저의 건물 소유권이 있는지 확인
		String userNo = houseRepository.findUserNoByHouseNo(roomDto.getHouseNo());
		if(!userNo.equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("해당 건물에 대한 등록 권한이 없습니다.");
		
		// userNo 조립
		roomDto.setUserNo(userNo);
		
		// imageCount 기본값 설정
		roomDto.setRoomImageCount(0);
		
		// delete 기본값 설정
		roomDto.setDeleted(false);
		roomDto.setRoomMonthly(normalizeRoomMonthly(roomDto.getRoomMethod(), roomDto.getRoomMonthly()));
		RoomEntity entity = roomRepository.save(roomDto.toEntity());

		// 임베딩 위해 상태 추가 (PENDING)
		roomEmbeddingRepository.save(RoomEmbeddingEntity.builder()
												.roomNo(entity.getRoomNo())
												.embeddingStatus("PENDING")
												.retryCount(0)
												.build()
				);
		
		// DB에 저장
		return entity.toDto();
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
		if (roomAvailabilityPolicyService.hasCurrentOccupancy(roomNo)) {
			throw new IllegalArgumentException("현재 거주중인 방은 삭제할 수 없습니다.");
		}

		long roomResult = roomRepository.softDeleteByRoomNo(roomNo);
		if (roomResult != 1L) throw new IllegalStateException("방 정보 삭제 실패");
	}

	private RoomDto selectRoomCore(String roomNo) {
		// selectRoom의 조회수 처리 분기용 공통 로직
		// 방 상세 조회
		Optional<RoomEntity> optional = roomRepository.findById(roomNo);
		if(!optional.isPresent()) throw new NotFoundException("해당 방을 조회할 수 없습니다.");
		RoomEntity roomEntity = optional.get();
		if(roomEntity == null) throw new NotFoundException("해당 방을 조회할 수 없습니다.");
		RoomDto roomDto = roomEntity.toDto();
		applyAvailability(roomDto, roomEntity);

		return roomDto;
	}

	@Override
	public RoomDto selectRoom(String roomNo) {
		// 방 상세 조회
		RoomDto roomDto = selectRoomCore(roomNo);
		
		// 조회수 증가
		try {
			rvService.upsertRoomView(roomNo);
		} catch (Exception ignored) {}	// 조회수 처리 실패해도 상세보기는 성공하도록
		
		return roomDto;
	}

	@Override
	public RoomDto selectRoomForEdit(String roomNo) {
		// 방 상세 조회
		RoomDto roomDto = selectRoomCore(roomNo);
		
		// 조회수 처리 안함
		
		return roomDto;
	}

	@Override
	public List<RoomDto> selectRoomsByHouseNo(String houseNo) {
		// 건물 내 방 목록 조회
		List<RoomEntity> rows = roomRepository.findAllByHouseNoAndDeletedFalseOrderByRoomName(houseNo);
		List<RoomDto> list = new ArrayList<>();
		rows.forEach(entity -> {
			RoomDto dto = entity.toDto();
			applyAvailability(dto, entity);
			list.add(dto);
		});
		return list;
	}

	@Override
	@Transactional
	public RoomDto updateRoom(RoomDto roomDto, String currentUser) {
		// 방 정보 수정
		
		// 방이 DB에 있는지 검사
		Optional<RoomEntity> row = roomRepository.findById(roomDto.getRoomNo());
		if(!row.isPresent()) throw new NotFoundException("방을 조회할 수 없습니다.");
		RoomEntity entity = row.get();
		
		// 방 소유권 검사
		String userNo = entity.getUserNo();
		if (!userNo.equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("수정 권한이 없습니다.");
		
		// userNo 조립
		entity.setRoomName(roomDto.getRoomName());
		entity.setRoomDeposit(roomDto.getRoomDeposit());
		entity.setRoomMonthly(normalizeRoomMonthly(roomDto.getRoomMethod(), roomDto.getRoomMonthly()));
		entity.setRoomMethod(roomDto.getRoomMethod());
		entity.setRoomArea(roomDto.getRoomArea());
		entity.setRoomFacing(roomDto.getRoomFacing());
		entity.setRoomAvailableDate(roomDto.getRoomAvailableDate());
		entity.setRoomAbstract(roomDto.getRoomAbstract());
		entity.setRoomRoomCount(roomDto.getRoomRoomCount());
		entity.setRoomBathCount(roomDto.getRoomBathCount());
		entity.setRoomEmptyYn(roomDto.getRoomEmptyYn());
		entity.setRoomStatus(roomDto.getRoomStatus());
		entity.setRoomOptions(roomDto.getRoomOptions());
		
		// 임베딩 위해 상태 추가 (PENDING)
		roomEmbeddingRepository.save(RoomEmbeddingEntity.builder()
												.roomNo(entity.getRoomNo())
												.embeddingStatus("PENDING")
												.retryCount(0)
												.build()
				);
		
		return entity.toDto();
	}

	@Override
	@Transactional
	public RoomDto updateRoomAvailability(String roomNo, LocalDate date, String currentUser) {
		// 방 입주가능 일자 변경
		
		// 해당 방 조회
		Optional<RoomEntity> optional = roomRepository.findById(roomNo);
		if(!optional.isPresent()) throw new NotFoundException("존재하지 않는 방입니다.");
		
		RoomEntity roomEntity = optional.get();
		
		// 소유권 검사
		if(!roomEntity.getUserNo().equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("입주일자 변경 가능 권한이 없습니다.");
		
		roomEntity.setRoomAvailableDate(date);
		return roomEntity.toDto();
	}

	@Override
	public Slice<RoomSearchResponse> selectRoomsInHouseMarker(RoomSearchCondition cond, Pageable pageable, String houseNo) {
		// 건물 마커 클릭시 리스트 조회
		
		// bbox 좌표 크기순서 보증
		cond.adjustment();
		
		// 방 검색 결과 조회 -> 응답객체에 저장
		Slice<RoomSearchResponse> slice = roomRepository.searchRooms(cond, pageable, houseNo)
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

		for (RoomSearchResponse item : slice.getContent()) {
			applyAvailability(item, item.getRoomNo(), null, item.getRoomEmptyYn());
		}
		
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
	public void updateRoomImageCount(String roomNo, int imageCount) {
		// 방 이미지 갯수 업데이트

		Optional<RoomEntity> row = roomRepository.findById(roomNo);
		if(!row.isPresent()) throw new NotFoundException("건물을 조회할 수 없습니다.");
		RoomEntity entity = row.get();
		
		entity.setRoomImageCount(imageCount);
	}

	@Override
	public RoomDto updateRoomEmptyYn(String roomNo, String currentUser) {
		// 방 공실 여부 변경
		
		// 해당 방 조회
		Optional<RoomEntity> optional = roomRepository.findById(roomNo);
		if(!optional.isPresent()) throw new NotFoundException("존재하지 않는 방입니다.");
		
		RoomEntity roomEntity = optional.get();
		
		// 소유권 검사
		if(!roomEntity.getUserNo().equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("입주일자 변경 가능 권한이 없습니다.");
		
		roomEntity.setRoomEmptyYn(!roomEntity.getRoomEmptyYn());
		return roomEntity.toDto();
	}
	
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	
	@Override
	public List<ViewsRankingResponse> selectPopularRoomsLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<ViewsRankingResponse> list = rvRepository.findPopularSince(cutoff, PageRequest.of(0, limit));
		
		String imageName = null;
		for(ViewsRankingResponse res : list) {
			 RoomImageEntity row = riRepository.findTop1ByRoomNoOrderByRoomImageNoAsc(res.getRoomNo());
			 if(row == null) continue;
			 imageName = row.getRoomStoredImageName();
			 res.setRepImageName(imageName);
		}
		
		return list;
	}
	
	public List<ReviewRankingResponse> selectTopNByRating(int hours, int limit){
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<ReviewRankingResponse> list = reviewRepository.findPopularSince(cutoff, PageRequest.of(0, limit));
		
		String imageName = null;
		for(ReviewRankingResponse res : list) {
			 RoomImageEntity row = riRepository.findTop1ByRoomNoOrderByRoomImageNoAsc(res.getRoomNo());
			 if(row == null) continue;
			 imageName = row.getRoomStoredImageName();
			 res.setRepImageName(imageName);
		}

		return list;
	}

	@Override
	public List<WishRankingResponse> selectTopNByWish(int limit) {
		List<WishRankingResponse> list = wishlistRepository.findPopularSince(PageRequest.of(0, limit));
		
		String imageName = null;
		for(WishRankingResponse res : list) {
			 RoomImageEntity row = riRepository.findTop1ByRoomNoOrderByRoomImageNoAsc(res.getRoomNo());
			 if(row == null) continue;
			 imageName = row.getRoomStoredImageName();
			 res.setRepImageName(imageName);
		}
		
		return list;
	}

	@Override
	public List<RoomSearchResponse> selectRoomRag(String text) {
		// 이 메서드는 "자연어 문장 -> RAG 추천 방 목록" 흐름의 Spring 측 연결 지점입니다.
		//
		// 역할을 나누면:
		// 1. FastAPI RAG 서버에 자연어 문장을 전달한다.
		// 2. RAG 서버가 돌려준 roomNo 순위를 받는다.
		// 3. DB에서 실제 RoomEntity를 조회해 프론트가 쓸 RoomDto로 바꾼다.
		//
		// 여기서 중요한 점:
		// roomRepository.findAllById(...)는 "입력한 순서"를 보장하지 않을 수 있습니다.
		// 그래서 아래에서 Map을 한 번 만든 뒤, roomNoList 순서대로 다시 dtoList를 조립합니다.
		WebClient webClient = webClientBuilder.build();
		
		RoomRagResponse response;
		try {
			Mono<RoomRagResponse> monoResponse = webClient.post()
					.uri(aiServerUri.concat("/ai/rag/room"))
					.contentType(MediaType.TEXT_PLAIN)
					.bodyValue(text)
					.retrieve()
					.onStatus(HttpStatusCode::isError, clientResponse -> clientResponse.bodyToMono(String.class)
							.defaultIfEmpty("")
							.map(body -> new IllegalStateException("AI 방 검색 서버 오류(" + clientResponse.statusCode().value()
									+ "): " + body)))
					.bodyToMono(RoomRagResponse.class);
			response = monoResponse.block();
		} catch (WebClientResponseException e) {
			throw new IllegalStateException(
					"AI 방 검색 서버 호출 실패(" + e.getStatusCode().value() + "): " + e.getResponseBodyAsString(),
					e);
		} catch (Exception e) {
			throw new IllegalStateException("AI 방 검색 서버 호출 중 오류가 발생했습니다: " + e.getMessage(), e);
		}

		// RAG 서버가 비어 있는 결과를 주면 바로 빈 리스트를 반환합니다.
		// 프론트는 "추천 결과 없음"으로 자연스럽게 처리할 수 있습니다.
		List<String> roomNoList = response != null ? response.getRoom_list() : null;
		if (roomNoList == null || roomNoList.isEmpty()) {
			return List.of();
		}

		// DB 조회는 roomNo 기준으로 한 번에 처리해 성능을 아낍니다.
		List<RoomEntity> entityList = roomRepository.findAllById(roomNoList);

		// entityMap:
		// roomNo -> RoomEntity 형태로 바꿔 두면
		// 이후 roomNoList의 "RAG 추천 순서"를 그대로 복원하기 쉽습니다.
		Map<String, RoomEntity> entityMap = new HashMap<>();
		for (RoomEntity entity : entityList) {
			entityMap.put(entity.getRoomNo(), entity);
		}

		// dtoList:
		// 최종적으로 프론트에 내려줄 결과입니다.
		// roomNoList 순서대로 다시 꺼내기 때문에 RAG 점수 순위가 유지됩니다.
		List<RoomSearchResponse> dtoLists = new ArrayList<>();
		for (String roomNo : roomNoList) {
			RoomEntity entity = entityMap.get(roomNo);
			if (entity != null) {
				RoomSearchResponse item = RoomSearchResponse.builder()
						.roomNo(entity.getRoomNo())
						.roomName(entity.getRoomName())
						.houseNo(entity.getHouseNo())
						.roomUpdatedAt(entity.getRoomUpdatedAt())
						.roomDeposit(entity.getRoomDeposit())
						.roomMonthly(entity.getRoomMonthly())
						.roomMethod(entity.getRoomMethod())
						.roomArea(entity.getRoomArea())
						.roomFacing(entity.getRoomFacing())
						.roomRoomCount(entity.getRoomRoomCount())
						.roomEmptyYn(entity.getRoomEmptyYn())
						.roomImageCount(entity.getRoomImageCount())
						.build();

				HouseEntity house = houseRepository.findById(entity.getHouseNo()).orElse(null);
				if (house != null) {
					item.setHouseName(house.getHouseName());
					item.setHouseAddress(house.getHouseAddress());
				}

				List<RoomImageDto> images = roomImageService.selectRoomImages(entity.getRoomNo());
				if (!images.isEmpty()) {
					List<String> imageNames = new ArrayList<>();
					for (RoomImageDto image : images) {
						imageNames.add(image.getRoomStoredImageName());
					}
					item.setImageNames(imageNames);
				}

				dtoLists.add(item);
			}
		}
		
		return dtoLists;
	}

	private void applyAvailability(RoomDto dto, RoomEntity entity) {
		applyAvailability(dto, entity.getRoomNo(), entity.getRoomAvailableDate(), entity.getRoomEmptyYn());
	}

	private void applyAvailability(RoomDto dto, String roomNo, LocalDate fallbackAvailableDate, Boolean fallbackEmptyYn) {
		RoomAvailabilityPolicyService.RoomAvailabilityPolicy policy = roomAvailabilityPolicyService.evaluate(
				roomNo,
				fallbackAvailableDate,
				fallbackEmptyYn
		);
		dto.setRoomEmptyYn(policy.roomEmpty());
		dto.setCanTourApply(policy.canTourApply());
		dto.setCanContractApply(policy.canContractApply());
		dto.setOccupancyEndDate(policy.occupancyEndDate());
		if (policy.actualAvailableDate() != null) {
			dto.setRoomAvailableDate(policy.actualAvailableDate());
		}
	}

	private void applyAvailability(RoomSearchResponse dto, String roomNo, LocalDate fallbackAvailableDate, Boolean fallbackEmptyYn) {
		RoomAvailabilityPolicyService.RoomAvailabilityPolicy policy = roomAvailabilityPolicyService.evaluate(
				roomNo,
				fallbackAvailableDate,
				fallbackEmptyYn
		);
		dto.setRoomEmptyYn(policy.roomEmpty());
		dto.setCanTourApply(policy.canTourApply());
		dto.setCanContractApply(policy.canContractApply());
		dto.setOccupancyEndDate(policy.occupancyEndDate());

		if (policy.actualAvailableDate() != null) {
			dto.setRoomAvailableDate(policy.actualAvailableDate());
		}
	}
	private Long normalizeRoomMonthly(String roomMethod, Long roomMonthly) {
		if ("L".equals(roomMethod) && roomMonthly == null) {
			return 0L;
		}
		return roomMonthly;
	}
}
