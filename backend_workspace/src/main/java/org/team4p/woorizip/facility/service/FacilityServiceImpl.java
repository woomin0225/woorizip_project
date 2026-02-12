package org.team4p.woorizip.facility.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityImageDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.jpa.entity.FacilityCategoryEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityCategoryRepository;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {
	
	private final FacilityRepository facilityRepository;
	private final FacilityCategoryRepository categoryRepository;
	
	// 시설 목록 조회
	@Override
	public List<FacilityListResponseDTO> getFacilityList(String houseNo) {
		List<FacilityEntity> entity = facilityRepository.findByHouseNoAndFacilityDeletedAtIsNull(houseNo);
		return entity.stream()
				.map(FacilityListResponseDTO::from)
				.toList();
	}
	
	// 시설 신규 등록
	@Override
	@Transactional
	public void createFacility(FacilityCreateRequestDTO dto) {
		// 카테고리 선택에 따른 옵션 기본값 가져오기
		FacilityCategoryEntity facilityCategory = categoryRepository.findById(dto.getFacilityCode())
				.orElseThrow(() -> new RuntimeException("no category data exists"));
		
		// 기본값 + 입력값
		String finalName = 
				dto.getFacilityName() != null && !(dto.getFacilityName().isEmpty())
			    ? dto.getFacilityName() 
			    : facilityCategory.getFacilityType();
		
		Map<String, Boolean> finalOptions = new HashMap<>(facilityCategory.getFacilityOptions());
		if(dto.getFacilityOptionInfo() != null) finalOptions.putAll(dto.getFacilityOptionInfo());
		
		// 시설 정보 입력
		FacilityEntity facility = FacilityEntity.builder()
	            .facilityName(finalName)
	            .facilityLocation(dto.getFacilityLocation())
	            .facilityStatus(dto.getFacilityStatus())
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
		return;
	}
}
