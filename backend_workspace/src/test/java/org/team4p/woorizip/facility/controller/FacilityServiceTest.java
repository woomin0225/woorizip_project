package org.team4p.woorizip.facility.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityImageDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityModifyRequestDTO;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.facility.service.FacilityServiceImpl;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.repository.HouseRepository;

@ExtendWith(MockitoExtension.class)
class FacilityServiceTest {

	@Mock
	private FacilityRepository facilityRepository;

	@Mock
	private HouseRepository houseRepository;

	@InjectMocks
	private FacilityServiceImpl facilityService;

	@Test
	void test() {
		// 가상 환경 설정
		HouseEntity mockHouse = mock(HouseEntity.class);
		lenient().when(mockHouse.getHouseNo()).thenReturn("HOUSE_001");
		lenient().when(houseRepository.findAllByUserNoOrderByHouseName(anyString())).thenReturn(List.of(mockHouse));

		// 시설 생성 디티오 채우기
		FacilityCreateRequestDTO dto = new FacilityCreateRequestDTO();

		Map<String, Boolean> optionInfo = new HashMap<>();
		optionInfo.put("wifi", true);
		optionInfo.put("parking", true);

		List<FacilityImageDTO> images = new ArrayList<>();

		FacilityImageDTO img1 = new FacilityImageDTO();
		img1.setFacilityImageNo(1);
		img1.setFacilityOriginalImageName("my_room.jpg");
		img1.setFacilityStoredImageName("20260219_uuid_my_room.jpg");

		images.add(img1);

		dto.setHouseNo("HOUSE_001");
		dto.setFacilityCode(null);
		dto.setFacilityName("시설1");
		dto.setFacilityOptionInfo(optionInfo);
		dto.setFacilityLocation(2);
		dto.setFacilityStatus(FacilityStatus.AVAILABLE);
		dto.setFacilityCapacity(5);
		dto.setFacilityOpenTime(LocalTime.of(9, 00));
		dto.setFacilityCloseTime(LocalTime.of(21, 00));
		dto.setFacilityRsvnRequiredYn(true);
		dto.setMaxRsvnPerDay(2);
		dto.setFacilityRsvnUnitMinutes(30);
		dto.setFacilityMaxDurationMinutes(60);
		dto.setImages(images);
		
		// 방금 만든 facility 임시 저장
		ArgumentCaptor<FacilityEntity> captor = ArgumentCaptor.forClass(FacilityEntity.class);
		
		String savedNo = facilityService.createFacility(dto, "USER_0002");
		verify(facilityRepository, times(1)).save(any());
		
		// 방금 만든 facility 재구축
		verify(facilityRepository).save(captor.capture());
		FacilityEntity createdFacility = captor.getValue();
		
		lenient().when(facilityRepository.findByFacilityNoAndFacilityDeletedAtIsNull(savedNo))
        .thenReturn(Optional.of(createdFacility));

		// 상세조회 테스트
		facilityService.getFacilityDetails(savedNo);
		verify(facilityRepository, times(1)).findByFacilityNoAndFacilityDeletedAtIsNull(savedNo);
		
		List<FacilityEntity> mockList = List.of(createdFacility);
		lenient().when(facilityRepository.findByHouseHouseNoAndFacilityDeletedAtIsNull("HOUSE_001"))
        .thenReturn(mockList);
		
		// 리스트 조회 테스트
		List<FacilityListResponseDTO> listResult = facilityService.getFacilityList("HOUSE_001");
		assertEquals(1, listResult.size());
		verify(facilityRepository).findByHouseHouseNoAndFacilityDeletedAtIsNull("HOUSE_001");
		
		// 가상 환경 설정
		lenient().when(mockHouse.getUserNo()).thenReturn("USER_0002");
		createdFacility.setHouse(mockHouse);
		lenient().when(facilityRepository.findById(savedNo)).thenReturn(Optional.of(createdFacility));
		
		// 시설 수정 테스트
		FacilityModifyRequestDTO modifyDto = new FacilityModifyRequestDTO();
		modifyDto.setFacilityName("시설수정1");
		
		facilityService.modifyFacility(savedNo, modifyDto, "USER_0002");
		
		verify(facilityRepository, atLeastOnce()).findById(savedNo);
		assertEquals("시설수정1", createdFacility.getFacilityName());
		assertEquals(LocalTime.of(9, 00), createdFacility.getFacilityOpenTime());
		
		// FacilityService Test Passed
	}
}
