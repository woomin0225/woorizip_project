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
	
	@Override
	public List<FacilityListResponseDTO> getFacilityList(String houseNo) {
		List<FacilityEntity> entity = fr.findByHouseNoAndFacilityDeletedAtIsNull(houseNo);
		return entity.stream()
				.map(FacilityListResponseDTO::from)
				.toList();
	}
}
