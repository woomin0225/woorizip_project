package org.team4p.woorizip.facility.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.facility.dto.FacilityCategoryCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityCategoryDTO;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityDetailResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityImageDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityModifyRequestDTO;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityCategoryEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityCategoryRepository;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;
import org.team4p.woorizip.reservation.jpa.repository.ReservationRepository;
import org.team4p.woorizip.reservation.service.ReservationServiceImpl;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {

	private final FacilityRepository facilityRepository;
	private final FacilityCategoryRepository categoryRepository;
	private final HouseRepository houseRepository;
	private final ReservationRepository reservationRepository;
	private final ReservationServiceImpl reservationService;

	// 시설 목록 조회
	@Override
	@Transactional(readOnly = true)
	public List<FacilityListResponseDTO> getFacilityList(String houseNo) {
		List<FacilityEntity> entity = facilityRepository.findByHouseHouseNoAndFacilityDeletedAtIsNull(houseNo);
		return entity.stream()
				.map(FacilityListResponseDTO::from)
				.toList();
	}

	// 시설 신규 등록
	@Override
	@Transactional
	public void createFacility(FacilityCreateRequestDTO dto, String userNo) {
		// userNo로 houseList 추출
		List<HouseEntity> houseList = houseRepository.findAllByUserNoOrderByHouseName(userNo);

		// houseNo 매칭
		HouseEntity selectedHouse = null;
		for (HouseEntity house : houseList) {
			if (house.getHouseNo().equals(dto.getHouseNo())) {
				selectedHouse = house;
				break;
			}
		}
		
		if (selectedHouse == null) {
			throw new NotFoundException("해당 건물의 소유자로 등록되어 있지 않습니다.");
		}

		// 카테고리 선택에 따른 옵션 기본값 가져오기 : 미선택 시 기본값 미적용
		FacilityCategoryEntity facilityCategory = null;
		if (dto.getFacilityCode() != null) {
			facilityCategory = categoryRepository.findById(dto.getFacilityCode()).orElse(null);
		}

		// 이름 덮어쓰기
		String finalName = "공용시설";
		if (dto.getFacilityName() != null && !dto.getFacilityName().isEmpty()) {
			finalName = dto.getFacilityName();
		} else if (facilityCategory != null) {
			finalName = facilityCategory.getFacilityType();
		}

		// 옵션 덮어쓰기
		Map<String, Boolean> finalOptions = new HashMap<>();
		if (facilityCategory != null && facilityCategory.getFacilityOptions() != null) {
			finalOptions.putAll(facilityCategory.getFacilityOptions());
		}
		if (dto.getFacilityOptionInfo() != null) {
			finalOptions.putAll(dto.getFacilityOptionInfo());
		}

		// 동일 카테고리의 시설이 있는지 확인
		Optional<FacilityEntity> lastSequence = facilityRepository
				.findFirstByHouse_HouseNoAndCategory_FacilityCodeOrderByFacilitySequenceDesc(
						selectedHouse, dto.getFacilityCode());

		// 동일 카테고리 시설 순서 배정
		Integer nextSequence;
		if (lastSequence.isPresent()) {
			nextSequence = lastSequence.get().getFacilitySequence() + 1;
		} else {
			nextSequence = 1;
		}

		// 예약이 필요없는 시설이라면 예약 관련 검증 값 null 처리
		Integer finalMaxRsvn = dto.getMaxRsvnPerDay();
		Integer finalUnitMin = dto.getFacilityRsvnUnitMinutes();
		Integer finalMaxDur = dto.getFacilityMaxDurationMinutes();

		if (!dto.isFacilityRsvnRequiredYn()) {
			finalMaxRsvn = null;
			finalUnitMin = null;
			finalMaxDur = null;
		}

		// 시설 정보 입력
		FacilityEntity facility = FacilityEntity
				.builder()
				.facilityNo(UUID.randomUUID().toString())
				.house(selectedHouse)
				.category(facilityCategory)
				.facilityName(finalName)
				.facilitySequence(nextSequence)
				.facilityOptionInfo(finalOptions)
				.facilityLocation(dto.getFacilityLocation())
				.facilityStatus(FacilityStatus.AVAILABLE)
				.facilityCapacity(dto.getFacilityCapacity())
				.facilityOpenTime(dto.getFacilityOpenTime())
				.facilityCloseTime(dto.getFacilityCloseTime())
				.facilityRsvnRequiredYn(dto.isFacilityRsvnRequiredYn())
				.maxRsvnPerDay(finalMaxRsvn)
				.facilityRsvnUnitMinutes(finalUnitMin)
				.facilityMaxDurationMinutes(finalMaxDur).build();

		// 이미지 입력
		if (dto.getImages() != null) {
			for (FacilityImageDTO imageDto : dto.getImages()) {
				FacilityImageEntity imageEntity = FacilityImageEntity
						.builder()
						.facilityOriginalImageName(imageDto.getFacilityOriginalImageName())
						.facilityStoredImageName(imageDto.getFacilityStoredImageName())
						.facility(facility)
						.build();
				facility.getImages().add(imageEntity);
			}
		}

		facilityRepository.save(facility);
	}

	// 시설 카테고리 등록
	@Override
	@Transactional
	public void createCategory(FacilityCategoryCreateRequestDTO dto) {
		if (categoryRepository.existsByFacilityType(dto.getFacilityType())) {
			throw new ForbiddenException("같은 이름의 카테고리가 존재합니다.");
		}

		List<String> categoryOptions = dto.getFacilityOptions();
		Map<String, Boolean> optionsToMap = categoryOptions.stream()
				.collect(Collectors.toMap(
						name -> name,
						name -> true));

		FacilityCategoryEntity category = FacilityCategoryEntity
				.builder()
				.facilityType(dto.getFacilityType())
				.facilityOptions(optionsToMap)
				.build();
		categoryRepository.save(category);
	}

	// 시설 카테고리 조회
	@Override
	@Transactional(readOnly = true)
	public List<FacilityCategoryDTO> getFacilityCategory() {
		List<FacilityCategoryEntity> categories = categoryRepository.findAll();
		return categories.stream()
				.map(FacilityCategoryDTO::from)
				.collect(Collectors.toList());
	}

	// 시설 카테고리 수정
	@Override
	@Transactional
	public void modifyFacilityCategory(Integer facilityCode, FacilityCategoryDTO dto) {
		// 시설 코드 찾기
		FacilityCategoryEntity category = categoryRepository.findById(facilityCode)
				.orElseThrow(() -> new NotFoundException("해당 카테고리를 찾을 수 없습니다."));

		List<String> categoryOptions = dto.getFacilityOptions();
		Map<String, Boolean> optionsToMap = categoryOptions.stream()
				.collect(Collectors.toMap(
						name -> name,
						name -> true));

		// dto 업데이트
		category.updateCategory(dto, optionsToMap);
	}

	// 시설 상세 조회
	@Override
	@Transactional(readOnly = true)
	public FacilityDetailResponseDTO getFacilityDetails(String facilityNo) {
		return facilityRepository.findByFacilityNoAndFacilityDeletedAtIsNull(facilityNo)
				.map(FacilityDetailResponseDTO::from)
				.orElseThrow(() -> new NotFoundException("해당 시설 정보를 찾을 수 없습니다."));
	}

	@Override
	@Transactional
	public void modifyFacility(String facilityNo, FacilityModifyRequestDTO dto, String userNo) {
		// 시설 번호 찾기
		FacilityEntity entity = facilityRepository.findById(facilityNo)
				.orElseThrow(() -> new NotFoundException("해당 시설 정보를 찾을 수 없습니다."));
		
		// 권한 확인하기
	    if (!entity.getHouse().getUserNo().equals(userNo)) {
	        throw new ForbiddenException("해당 시설의 소유자로 등록되어 있지 않습니다."); 
	    }
	    
	    // 임대인이 이전에 사용 불가 기간을 설정한 적이 있다면 해당 예약 내역 전부 삭제
	    reservationRepository.deleteByFacility_FacilityNoAndUser_UserNo(facilityNo, userNo);

	    // 사용 불가 지정 기간 내에 예약이 있는지 확인
	    if (dto.getFacilityStatus() == FacilityStatus.UNAVAILABLE) {
	            
	    	// 해당 기간 내에 예약이 있는 날짜 확인
	    	List<LocalDate> datesWithReservation = reservationRepository.findDatesByPeriod(
	                facilityNo,
	                dto.getBlockedStartTime().toLocalDate(), 
	                dto.getBlockedEndTime().toLocalDate()
	            );

	    	// 예약일시가 사용 불가 기간 범위인지 확인
	    	if (!datesWithReservation.isEmpty()) {
	    		List<ReservationEntity> reservationsInRange = reservationRepository.findByFacility_FacilityNoAndReservationDateBetween(
	    		    		facilityNo,
	    		    		dto.getBlockedStartTime().toLocalDate(),
	    		    		dto.getBlockedEndTime().toLocalDate());

	    		for (ReservationEntity rsvn : reservationsInRange) {
	    		    LocalDateTime rsvnStart = LocalDateTime.of(rsvn.getReservationDate(), rsvn.getReservationStartTime());
	    		    LocalDateTime rsvnEnd = LocalDateTime.of(rsvn.getReservationDate(), rsvn.getReservationEndTime());

	    		    if (rsvnStart.isBefore(dto.getBlockedEndTime()) && rsvnEnd.isAfter(dto.getBlockedStartTime())) {
	    		        throw new ForbiddenException("설정하신 사용 불가 기간 내에 예약 내역이 있습니다.");
	    		    }
	    		}
	    	}
	    }
	    
		// 이미지 삭제 후 재업로드
		if (dto.getImages() != null) {
			entity.getImages().clear();
			for (FacilityImageDTO imageDto : dto.getImages()) {
				FacilityImageEntity imageEntity = FacilityImageEntity
						.builder()
						.facilityOriginalImageName(imageDto.getFacilityOriginalImageName())
						.facilityStoredImageName(imageDto.getFacilityStoredImageName())
						.facility(entity)
						.build();
				entity.getImages().add(imageEntity);
			}
		}

		// 최종 업데이트
		entity.updateFacility(dto);
		if (dto.getFacilityStatus() == FacilityStatus.UNAVAILABLE) {
	        reservationService.createBlockReservation(
	            facilityNo, 
	            dto.getBlockedStartTime(), 
	            dto.getBlockedEndTime(),
	            userNo
	        );
	    }
	}
}
