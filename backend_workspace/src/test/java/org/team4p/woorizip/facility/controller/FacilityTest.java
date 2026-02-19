package org.team4p.woorizip.facility.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityImageDTO;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.facility.service.FacilityServiceImpl;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;

@ExtendWith(MockitoExtension.class)
class FacilityTest {
	
	@Mock
    private FacilityRepository facilityRepository; // 가짜 DB 준비
	
	@Mock // 👈 이거 추가!! 서윤아 이거 빼먹어서 그래!!
    private HouseRepository houseRepository;

    @InjectMocks
    private FacilityServiceImpl facilityService; // 테스트할 서비스에 가짜 DB 주입
	
	@Test
	void test() {
		HouseEntity mockHouse = mock(HouseEntity.class);
		
		lenient().when(houseRepository.findByUserNo(anyString()))
	    .thenReturn(Optional.of(mockHouse));
		
		FacilityCreateRequestDTO dto = new FacilityCreateRequestDTO();
		
			Map<String, Boolean> optionInfo = new HashMap<>();
			optionInfo.put("wifi", true);
			optionInfo.put("parking", true);
			
			List<FacilityImageDTO> images = new ArrayList<>();

			FacilityImageDTO img1 = new FacilityImageDTO();
			// 1. 번호 (그냥 1번!)
			img1.setFacilityImageNo(1);

			// 2. 원래 파일 이름 (서윤이가 올린 척하는 이름)
			img1.setFacilityOriginalImageName("my_room.jpg");

			// 3. 저장된 파일 이름 (서버가 바꾼 척하는 이름)
			img1.setFacilityStoredImageName("20260219_uuid_my_room.jpg");

			// 리스트에 추가!
			images.add(img1);
			
			dto.setFacilityCode(null);
			dto.setFacilityName("시설1");
			dto.setFacilityOptionInfo(optionInfo);
			dto.setFacilityLocation(2);
			dto.setFacilityStatus(FacilityStatus.AVAILABLE);
			dto.setFacilityCapacity(5);
			dto.setFacilityOpenTime(LocalTime.of(9,00));
			dto.setFacilityCloseTime(LocalTime.of(21,00));
			dto.setFacilityRsvnRequiredYn(true);
			dto.setMaxRsvnPerDay(2);
			dto.setFacilityRsvnUnitMinutes(30);
			dto.setFacilityMaxDurationMinutes(60);
			dto.setImages(images);
			
			facilityService.createFacility(dto, "USER_0002");
			verify(facilityRepository, times(1)).save(any());
	}

}
