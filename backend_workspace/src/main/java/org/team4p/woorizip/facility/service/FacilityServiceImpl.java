package org.team4p.woorizip.facility.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.team4p.woorizip.common.config.UploadProperties;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.common.validator.LesseeValidator;
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
import org.team4p.woorizip.reservation.enums.ReservationStatus;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;
import org.team4p.woorizip.reservation.jpa.repository.ReservationRepository;
import org.team4p.woorizip.reservation.service.ReservationServiceImpl;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {

	private final FacilityRepository facilityRepository;
	private final FacilityCategoryRepository categoryRepository;
	private final HouseRepository houseRepository;
	private final ReservationRepository reservationRepository;
	private final ReservationServiceImpl reservationService;
	private final UserRepository userRepository;
	private final LesseeValidator lesseeValidator;
	
	private final UploadProperties upload;
	
	// 시설 목록 조회
	@Override
	@Transactional(readOnly = true)
	public List<FacilityListResponseDTO> getFacilityList(String houseNo, String userNo) {
		// 임차인
	    if (houseNo == null) {			
	    	String userHouseNo = lesseeValidator.validLessee(userNo);
			return facilityRepository.findByHouseHouseNoAndFacilityDeletedAtIsNull(userHouseNo)
		    		.stream()
		            .map(FacilityListResponseDTO::from)
		            .collect(Collectors.toList());
	    }
	    
	    // 임대인, 관리자
	    return facilityRepository.findByHouseHouseNoAndFacilityDeletedAtIsNull(houseNo)
	    		.stream()
	            .map(FacilityListResponseDTO::from)
	            .collect(Collectors.toList());
	}

	// 시설 신규 등록
	@Override
	@Transactional
	public void createFacility(List<MultipartFile> files, FacilityCreateRequestDTO dto, String userNo) {
		UserEntity user = userRepository.findById(userNo)
				.orElseThrow(() -> new NotFoundException("사용자 정보를 찾을 수 없습니다."));
		
		// 임대인 전용 메서드
		boolean isLessor = user.getRole().equals("USER") && user.getType().equals("LESSOR");
		if(!isLessor) throw new ForbiddenException("시설 등록 권한이 없습니다.");
		
		// userNo로 houseList 추출
		List<HouseEntity> houseList = houseRepository.findAllByUserNoAndDeletedFalseOrderByHouseName(userNo);

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
						selectedHouse.getHouseNo(), dto.getFacilityCode());

		// 동일 카테고리 시설 순서 배정
		Integer nextSequence;
		if (lastSequence.isPresent() && lastSequence.get().getFacilitySequence() != null) {
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
		
		// 이미지 저장 : 파일저장소 -> DB
		File saveDir = upload.facilityImageDir().toFile();
		if (!saveDir.exists()) saveDir.mkdirs();
		List<FacilityImageDTO> imageDtos = dto.getImages();
		for(int i = 0; i < files.size(); i++) {
			File saveFile = new File(saveDir, imageDtos.get(i).getFacilityStoredImageName());
			try {
	            files.get(i).transferTo(saveFile);	// 파일저장소에 먼저 저장
	        } catch (Exception e) {
	            continue;	// 파일저장소에 저장 실패하면 DB에도 저장하지 않음
	        }
			
			// DB에 이름 저장
			FacilityImageEntity entity = FacilityImageEntity
						.builder()
						.facilityOriginalImageName(imageDtos.get(i).getFacilityOriginalImageName())
						.facilityStoredImageName(imageDtos.get(i).getFacilityStoredImageName())
						.facility(facility)
						.build();
			facility.getImages().add(entity);
		}
		
//		// 이미지 입력
//		if (dto.getImages() != null) {
//			for (FacilityImageDTO imageDto : dto.getImages()) {
//		        // 이미지 DB에 이름 저장
//				FacilityImageEntity imageEntity = FacilityImageEntity
//						.builder()
//						.facilityOriginalImageName(imageDto.getFacilityOriginalImageName())
//						.facilityStoredImageName(imageDto.getFacilityStoredImageName())
//						.facility(facility)
//						.build();
//				facility.getImages().add(imageEntity);
//			}
//		}

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
	public void modifyFacility(List<MultipartFile> files, String facilityNo, FacilityModifyRequestDTO dto, String currentUserNo) {
		// 시설 정보 찾기
		FacilityEntity entity = facilityRepository.findById(facilityNo)
				.orElseThrow(() -> new NotFoundException("해당 시설 정보를 찾을 수 없습니다."));
		
		UserEntity user = userRepository.findById(currentUserNo)
				.orElseThrow(() -> new NotFoundException("사용자 정보를 찾을 수 없습니다."));
		 
		String userNo = entity.getHouse().getUserNo();
		boolean isAdmin = user.getRole().equals("ADMIN");
		
		if (!isAdmin && !userNo.equals(currentUserNo)) {
		    throw new ForbiddenException("해당 시설의 정보를 수정할 권한이 없습니다."); 
		}
		
		// 예약이 있으면 예약 필요 여부 변경 불가
		if(entity.getFacilityRsvnRequiredYn() && !dto.getFacilityRsvnRequiredYn()) {
			if(hasReservation(facilityNo)) throw new ForbiddenException("예정된 예약이 있어 예약 필요 여부를 변경할 수 없습니다.");
		}
		
		// 예약이 있으면 시설 삭제 불가
	    if(dto.getFacilityStatus() == FacilityStatus.DELETED) {
	    	if(hasReservation(facilityNo)) throw new ForbiddenException("예정된 예약이 있어 시설을 삭제할 수 없습니다.");
	    };
	    
	    // 임대인이 이전에 사용 불가 기간을 설정한 적이 있다면 해당 예약 내역 전부 삭제
	    reservationRepository.deleteByFacility_FacilityNoAndUser_UserNo(facilityNo, userNo);

	    // 사용 불가 지정 기간 내에 예약이 있는지 확인
	    if (dto.getFacilityStatus() == FacilityStatus.UNAVAILABLE) {
	    	// 해당 기간 내에 예약이 있는 날짜 확인
	    	List<ReservationEntity> reservations = reservationRepository.findByFacility_FacilityNoAndReservationDateBetweenAndReservationStatus(
	    		    facilityNo, 
	    		    dto.getBlockedStartTime().toLocalDate(), 
	    		    dto.getBlockedEndTime().toLocalDate(),
	    		    ReservationStatus.APPROVED);
	    	List<LocalDate> datesWithReservation = reservations.stream()
	    			.map(ReservationEntity::getReservationDate)
	    		    .distinct()
	    		    .toList();
	    	
	    	// 예약일시가 사용 불가 기간 범위인지 확인
	    	if (!datesWithReservation.isEmpty()) {
	    		for (ReservationEntity rsvn : reservations) {
	    		    LocalDateTime rsvnStart = LocalDateTime.of(rsvn.getReservationDate(), rsvn.getReservationStartTime());
	    		    LocalDateTime rsvnEnd = LocalDateTime.of(rsvn.getReservationDate(), rsvn.getReservationEndTime());

	    		    if (rsvnStart.isBefore(dto.getBlockedEndTime()) && rsvnEnd.isAfter(dto.getBlockedStartTime())) {
	    		        throw new ForbiddenException("설정하신 사용 불가 기간 내에 예약 내역이 있습니다.");
	    		    }
	    		}
	    	}
	    }
	    
		// 이미지 삭제 후 재업로드
		File fileDir = upload.facilityImageDir().toFile();

		List<Integer> deleteImageNos = dto.getDeleteImageNos();
		if (deleteImageNos != null && !deleteImageNos.isEmpty()) {
			for (Integer deleteImageNo : deleteImageNos) {
				if (deleteImageNo == null) continue;

				FacilityImageEntity target = entity.getImages().stream()
						.filter(img -> img.getFacilityImageNo() == deleteImageNo)
						.findFirst()
						.orElse(null);
				if (target == null) continue;

				entity.getImages().remove(target);

				File deleteFile = new File(fileDir, target.getFacilityStoredImageName());
				try {
					Files.deleteIfExists(deleteFile.toPath());
				} catch (IOException e) {
					throw new RuntimeException("공용시설 사진 삭제 중 오류가 발생했습니다: " + deleteFile);
				}
			}
		}

		List<FacilityImageDTO> imageDtos = dto.getImages();
		if (files != null && !files.isEmpty()) {
			if (imageDtos == null || imageDtos.size() != files.size()) {
				throw new RuntimeException("시설 이미지 정보가 올바르지 않습니다.");
			}

			if (!fileDir.exists()) fileDir.mkdirs();

			for (int i = 0; i < files.size(); i++) {
				MultipartFile file = files.get(i);
				FacilityImageDTO imageDto = imageDtos.get(i);
				File saveFile = new File(fileDir, imageDto.getFacilityStoredImageName());
				try {
					file.transferTo(saveFile);
				} catch (Exception e) {
					throw new RuntimeException("공용시설 이미지 저장에 실패했습니다.");
				}

				FacilityImageEntity imageEntity = FacilityImageEntity.builder()
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
	
	private boolean hasReservation(String facilityNo) {
		boolean hasActiveRsvn = reservationRepository.existsByFacility_FacilityNoAndReservationStatusAndReservationDateAfter(
    			facilityNo, ReservationStatus.APPROVED, LocalDate.now());
    	boolean hasRsvnToday = reservationRepository.existsByFacility_FacilityNoAndReservationStatusAndReservationDateAndReservationEndTimeAfter(
    			facilityNo, ReservationStatus.APPROVED, LocalDate.now(), LocalTime.now());
    	if(hasActiveRsvn || hasRsvnToday) return true;
    	return false;
	}
}
