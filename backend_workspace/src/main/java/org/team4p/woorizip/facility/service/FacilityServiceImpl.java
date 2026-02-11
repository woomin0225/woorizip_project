package org.team4p.woorizip.facility.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.team4p.woorizip.facility.dto.*;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import lombok.*;

@Service
@RequiredArgsConstructor
public class FacilityServiceImpl implements FacilityService {
	
	private final FacilityRepository fr;
	
	// 시설 목록 조회
	@Override
	public List<FacilityListResponseDTO> getFacilityList(String houseNo) {
		List<FacilityEntity> entity = fr.findByHouseNoAndFacilityDeletedAtIsNull(houseNo);
		return entity.stream()
				.map(FacilityListResponseDTO::from)
				.toList();
	}
	
	// 시설 신규 등록
	public void List<FacilityCreateRequestDTO> createFacility(String houseNo) {
		List<FacilityEntity> entity;
		return null;
	}
}
