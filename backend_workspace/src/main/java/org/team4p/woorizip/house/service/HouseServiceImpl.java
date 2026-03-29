package org.team4p.woorizip.house.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.house.dto.HouseDto;
import org.team4p.woorizip.house.dto.response.HouseMarkerResponse;
import org.team4p.woorizip.house.dto.response.ViewRankingResponse;
import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;
import org.team4p.woorizip.house.image.jpa.repository.HouseImageRepository;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.house.kakaoAPI.KakaoGeocodingResponse;
import org.team4p.woorizip.house.view.jpa.repository.HouseViewRepository;
import org.team4p.woorizip.house.view.service.HouseViewService;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.room.service.RoomAvailabilityPolicyService;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class HouseServiceImpl implements HouseService {
	private final HouseRepository houseRepository;
	private final @Qualifier("houseRestTemplate") RestTemplate houseRestTemplate;
	private final RoomRepository roomRepository;
	private final UserRepository userRepository;
	private final HouseImageRepository houseImageRepository;
	private final HouseViewService hvService;
	private final HouseViewRepository hvRepository;
	private final HouseImageRepository hiRepository;
	private final RoomAvailabilityPolicyService roomAvailabilityPolicyService;
	private @Value("${kakao.geocoding.api.uri}") String geoCodingApiUri;
	
	@Override
	public List<HouseMarkerResponse> selectHouseMarkers(RoomSearchCondition cond) {
		// 지도 내 건물 마커용 검색 결과 조회
		
		cond.adjustment();
		
		List<HouseEntity> rows = houseRepository.searchHouses(cond);
//		log.info("List<HouseEntity>={}",rows);
		List<HouseMarkerResponse> list = new ArrayList<>();
		for(HouseEntity item : rows) {
			// 각 건물의 이미지이름(stored) 리스트로 만들기
			List<String> imageNames = new ArrayList<>();
//			log.info("HOUSENO={}",item.getHouseNo());
			List<HouseImageEntity> imageRows = houseImageRepository.findAllByHouseNo(item.getHouseNo());
			
			imageRows.forEach(entity->imageNames.add(entity.getHouseStoredImageName()));
			
			// 검색조건 하의 각 건물들의 최소/최대가격
			Map<String, Long> map= houseRepository.searchPriceOfHouses(cond, item.getHouseNo());
			Long minDeposit = getOrZero(map, "minDeposit");
			Long maxDeposit = getOrZero(map, "maxDeposit");
			Long minMonthly = getOrZero(map, "minMonthly");
			Long maxMonthly = getOrZero(map, "maxMonthly");
			
			list.add(new HouseMarkerResponse(item, minDeposit, maxDeposit, minMonthly, maxMonthly, imageNames));
		}		
		
		return list;
	}
	
	private long getOrZero(Map<String, Long> map, String key) {
		if(map.isEmpty()) return 0L;
		Long value = map.get(key);
		return value == null ? 0L : value;
	}

	@Override
	public List<HouseDto> selectHousesByOwnerNo(String currentUser, String targetUserNo) {
		// 임대인 회원 건물 목록 조회
		String userNo = resolveHouseOwnerUserNo(currentUser, targetUserNo);
		List<HouseEntity> rows = houseRepository.findAllByUserNoAndDeletedFalseOrderByHouseName(userNo);
		List<HouseDto> list = new ArrayList<>();
		rows.forEach(entity->list.add(entity.toDto()));
		return list;
	}

	private String resolveHouseOwnerUserNo(String currentUser, String targetUserNo) {
		String currentUserNo = userRepository.findUserNoByEmailId(currentUser);
		if (currentUserNo == null || currentUserNo.isBlank()) {
			throw new NotFoundException("사용자 정보를 찾을 수 없습니다.");
		}

		if (targetUserNo == null || targetUserNo.isBlank()) {
			return currentUserNo;
		}

		String currentRole = userRepository.findById(currentUserNo)
				.map(user -> user.getRole())
				.orElse(null);

		return "ADMIN".equalsIgnoreCase(currentRole) ? targetUserNo : currentUserNo;
	}

	private HouseDto selectHouseCore(String houseNo) {
		// selectHouse의 조회수 처리 분기용
		// 건물 상세 조회
		Optional<HouseEntity> row = houseRepository.findById(houseNo);
		if(!row.isPresent()) throw new NotFoundException("해당 건물을 조회할 수 없습니다.");
		HouseEntity houseEntity = row.get();
		if(houseEntity == null) throw new NotFoundException("해당 건물을 조회할 수 없습니다.");
		HouseDto houseDto = houseEntity.toDto();

		return houseDto;
	}

	@Override
	public HouseDto selectHouse(String houseNo) {
		// 건물 상세 조회
		HouseDto houseDto = selectHouseCore(houseNo);

		// 조회수 증가 처리
		try {
			hvService.upsertHouseView(houseNo);
		} catch (Exception ignored) {}		// 조회수 처리 실패해도 상세보기는 성공하도록
		
		return houseDto;
	}

	@Override
	public HouseDto selectHouseForEdit(String houseNo) {
		// 건물 상세 조회
		HouseDto houseDto = selectHouseCore(houseNo);

		// 조회수 처리 안함
		
		return houseDto;
	}

	@Override
	@Transactional
	public HouseDto insertHouse(HouseDto houseDto, String currentUser) {
		// 건물 등록
		
		// 주소 -> 위도, 경도 전환
		// geocoding 요청할 URI 구성
		String uri = UriComponentsBuilder
				.fromUriString(geoCodingApiUri)
				.queryParam("query", houseDto.getHouseAddress().trim())
				.queryParam("analyze_type", "similar")
				.queryParam("page", 0)
				.queryParam("size", 1)
				.build()
//				.encode(StandardCharsets.UTF_8)
				.toUriString();
		log.info("geocoding uri = {}", uri);
		ResponseEntity<String> raw = houseRestTemplate.getForEntity(uri, String.class);
		log.info("kakao status={}", raw.getStatusCode());
		log.info("kakao body={}", raw.getBody());
		// RestTemplate 사용해서 API 응답 요청
		KakaoGeocodingResponse response = houseRestTemplate.getForObject(uri, KakaoGeocodingResponse.class);
		
		if (response == null || response.getDocuments() == null || response.getDocuments().isEmpty()) {
		    throw new IllegalArgumentException("주소를 좌표로 변환할 수 없습니다: " + houseDto.getHouseAddress());
		}
		
		double lat = Double.parseDouble(response.getDocuments().get(0).getY());
		double lng = Double.parseDouble(response.getDocuments().get(0).getX());
		houseDto.setHouseLat(lat);
		houseDto.setHouseLng(lng);
		
		// userNo 조립
		String userNo = userRepository.findUserNoByEmailId(currentUser);
		houseDto.setUserNo(userNo);
		
		// imageCount 기본값으로 적용
		houseDto.setHouseImageCount(0);
		
		// deleted 기본값으로 적용
		houseDto.setDeleted(false);
		
		// DB에 등록
		return houseRepository.save(houseDto.toEntity()).toDto();
	}

	@Override
	@Transactional
	public HouseDto updateHouse(HouseDto houseDto, String currentUser) {
		// 건물 정보 수정
		
		// 건물이 DB에 있는지 검사
		Optional<HouseEntity> row = houseRepository.findById(houseDto.getHouseNo());
		if(!row.isPresent()) throw new NotFoundException("건물을 조회할 수 없습니다.");
		HouseEntity entity = row.get();
		
		// 건물 소유권 검사
		String userNo = entity.getUserNo();
		if (!userNo.equals(userRepository.findUserNoByEmailId(currentUser))) throw new ForbiddenException("수정 권한이 없습니다.");
		
		entity.setHouseName(houseDto.getHouseName());
		entity.setHouseZip(houseDto.getHouseZip());
		entity.setHouseAddress(houseDto.getHouseAddress());
		entity.setHouseAddressDetail(houseDto.getHouseAddressDetail());
		entity.setHouseCompletionYear(houseDto.getHouseCompletionYear());
		entity.setHouseFloors(houseDto.getHouseFloors());
		entity.setHouseHouseHolds(houseDto.getHouseHouseHolds());
		entity.setHouseElevatorYn(houseDto.getHouseElevatorYn());
		entity.setHousePetYn(houseDto.getHousePetYn());
		entity.setHouseFemaleLimit(houseDto.getHouseFemaleLimit());
		entity.setHouseParkingMax(houseDto.getHouseParkingMax());
		entity.setHouseAbstract(houseDto.getHouseAbstract());
		
		// 위도/경도 업데이트
		// 주소 -> 위도, 경도 전환
		// geocoding 요청할 URI 구성
		String uri = UriComponentsBuilder
				.fromUriString(geoCodingApiUri)
				.queryParam("query", houseDto.getHouseAddress().trim())
				.queryParam("analyze_type", "similar")
				.queryParam("page", 0)
				.queryParam("size", 1)
				.build()
//				.encode(StandardCharsets.UTF_8)
				.toUriString();
		log.info("geocoding uri = {}", uri);
		ResponseEntity<String> raw = houseRestTemplate.getForEntity(uri, String.class);
		log.info("kakao status={}", raw.getStatusCode());
		log.info("kakao body={}", raw.getBody());
		// RestTemplate 사용해서 API 응답 요청
		KakaoGeocodingResponse response = houseRestTemplate.getForObject(uri, KakaoGeocodingResponse.class);
		
		if (response == null || response.getDocuments() == null || response.getDocuments().isEmpty()) {
		    throw new IllegalArgumentException("주소를 좌표로 변환할 수 없습니다: " + entity.getHouseAddress());
		}
		
		double lat = Double.parseDouble(response.getDocuments().get(0).getY());
		double lng = Double.parseDouble(response.getDocuments().get(0).getX());
		entity.setHouseLat(lat);
		entity.setHouseLng(lng);
		
		return entity.toDto();
	}

	@Override
	@Transactional
	public void deleteHouse(String houseNo, String currentUser) {
		// 건물 정보 삭제
		
		// 건물 있는지 검사
		Optional<HouseEntity> gettedHouse = houseRepository.findById(houseNo);
		if(!gettedHouse.isPresent()) throw new NotFoundException("해당 건물이 없습니다.");
		
		// 건물 있으면 소유권 검사 
		// 로그인한 유저와 gettedOwner 비교
		if(!gettedHouse.get().getUserNo().equals(userRepository.findUserNoByEmailId(currentUser))) {
			throw new ForbiddenException("삭제 권한이 없습니다.");
		}
		
		// 소유권 검사 통과하면 건물 소프트삭제 수행
		List<RoomEntity> rooms = roomRepository.findAllByHouseNoAndDeletedFalseOrderByRoomName(houseNo);
		long occupiedRoomCount = rooms.stream()
				.filter(room -> roomAvailabilityPolicyService.hasCurrentOccupancy(room.getRoomNo()))
				.count();
		if (occupiedRoomCount > 0) {
			throw new IllegalArgumentException("현재 거주중인 방이 있는 건물은 삭제할 수 없습니다.");
		}

		long houseResult = houseRepository.softDeleteByHouseNo(houseNo);
		if (houseResult != 1L) throw new IllegalStateException("건물 정보 삭제 실패");
		
		// 건물 삭제 통과하면 방 소프트 삭제 수행
		roomRepository.softDeleteByHouseNo(houseNo);
	}

	@Override
	@Transactional
	public void updateHouseImageCount(String houseNo, int imageCount) {
		// 건물 사진 갯수 업데이트
		
		Optional<HouseEntity> row = houseRepository.findById(houseNo);
		if(!row.isPresent()) throw new NotFoundException("건물을 조회할 수 없습니다.");
		HouseEntity entity = row.get();
		
		entity.setHouseImageCount(imageCount);
	}
	
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	
	@Override
	public List<ViewRankingResponse> selectPopularHousesLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<ViewRankingResponse> list = hvRepository.findPopularSince(cutoff, PageRequest.of(0, limit));
		
		String imageName = null;
		for(ViewRankingResponse res : list) {
			 HouseImageEntity row = hiRepository.findTop1ByHouseNoOrderByHouseImageNoAsc(res.getHouseNo());
			 if(row == null) continue;
			 imageName = row.getHouseStoredImageName();
			 res.setRepImageName(imageName);
		}
		
		return list;
	}
}
