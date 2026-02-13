package org.team4p.woorizip.facility.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.facility.dto.FacilityCategoryDTO;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityDetailResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityImageDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityModifyRequestDTO;
import org.team4p.woorizip.facility.jpa.entity.FacilityCategoryEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityCategoryRepository;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {
	
	private final FacilityRepository facilityRepository;
	private final FacilityCategoryRepository categoryRepository;
	private final HouseRepository houseRepository;
	
	// 시설 목록 조회
	@Override
	public List<FacilityListResponseDTO> getFacilityList(String houseNo) {
		List<FacilityEntity> entity = facilityRepository.findByHouseNoAndFacilityDeletedAtIsNull(houseNo);
		return entity.stream()
				.map(FacilityListResponseDTO::from)
				.toList();
	}
	
	// 시설 카테고리 등록
	@Override
	@Transactional
    public void createCategory(FacilityCategoryDTO dto) {
        FacilityCategoryEntity category = FacilityCategoryEntity.builder()
                .facilityType(dto.getFacilityType())
                .facilityOptions(dto.getFacilityOptions())
                .build();
        categoryRepository.save(category);
    }
	
	// 시설 신규 등록
	@Override
	@Transactional
	public void createFacility(FacilityCreateRequestDTO dto, String userNo) {
		// userNo로 houseNo 추출
		HouseEntity house = houseRepository.findByUserNo(userNo)
	            .orElseThrow(() -> new RuntimeException("no houseNo in userNo"));
		String houseNo = house.getHouseNo();
		
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
		
		// 시설 정보 입력
		FacilityEntity facility = FacilityEntity.builder()
				.facilityNo(UUID.randomUUID().toString())
				.houseNo(houseNo)
	            .facilityName(finalName)
	            .facilityOptionInfo(finalOptions)
	            .facilityLocation(dto.getFacilityLocation())
	            .facilityStatus(dto.getFacilityStatus())
	            .facilityCapacity(dto.getFacilityCapacity())
	            .facilityOpenTime(dto.getFacilityOpenTime())
	            .facilityCloseTime(dto.getFacilityCloseTime())
	            .facilityRsvnRequiredYn(dto.isFacilityRsvnRequiredYn())
	            .maxRsvnPerDay(dto.getMaxRsvnPerDay())
	            .facilityRsvnUnitMinutes(dto.getFacilityRsvnUnitMinutes())
	            .facilityMaxDurationMinutes(dto.getFacilityMaxDurationMinutes())
	            .build();
		
		// 이미지 입력
	    if (dto.getImages() != null) {
	        for (FacilityImageDTO imageDto : dto.getImages()) {
	        	FacilityImageEntity imageEntity = FacilityImageEntity.builder()
	                    .facilityOriginalImageName(imageDto.getFacilityOriginalImageName())
	                    .facilityStoredImageName(imageDto.getFacilityStoredImageName())
	                    .facilityNo(facility)
	                    .build();
	            facility.getImages().add(imageEntity);
	        }
	    }
	    
	    facilityRepository.save(facility);
	}
	
	// 시설 상세 조회
	@Override
	public FacilityDetailResponseDTO getFacilityDetails(String facilityNo) {
		return facilityRepository.findByFacilityNoAndFacilityDeletedAtIsNull(facilityNo)
	            .map(FacilityDetailResponseDTO::from)
	            .orElseThrow(() -> new RuntimeException("no facility exists"));
	}
	
	// 시설 정보 수정
	@Override
	@Transactional
	public void modifyFacility(String facilityNo, FacilityModifyRequestDTO dto) {
		// 시설번호 찾기
		FacilityEntity entity = facilityRepository.findById(facilityNo)
		        .orElseThrow(() -> new RuntimeException("no facility exists"));
		
		// 이미지 삭제 후 재업로드
		if (dto.getImages() != null) {
	        entity.getImages().clear();
	        for (FacilityImageDTO imageDto : dto.getImages()) {
	            FacilityImageEntity imageEntity = FacilityImageEntity.builder()
	                    .facilityOriginalImageName(imageDto.getFacilityOriginalImageName())
	                    .facilityStoredImageName(imageDto.getFacilityStoredImageName())
	                    .facilityNo(entity)
	                    .build();
	            entity.getImages().add(imageEntity);
	        }
	    }
		
		// dto 업데이트
		entity.updateFacility(dto);
	}
}
