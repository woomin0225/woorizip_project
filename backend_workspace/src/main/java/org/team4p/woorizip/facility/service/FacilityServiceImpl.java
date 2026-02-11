package org.team4p.woorizip.facility.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityImageDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.entity.FacilityImageEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {
	
	private final FacilityRepository facilityRepository;
	
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
		// 시설 정보 입력
		FacilityEntity facility = FacilityEntity.builder()
	            .facilityName(dto.getFacilityName())
	            .facilityLocation(dto.getFacilityLocation())
	            .facilityStatus(dto.getFacilityStatus())
	            .facilityOptionInfo(dto.getFacilityOptionInfo())
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
