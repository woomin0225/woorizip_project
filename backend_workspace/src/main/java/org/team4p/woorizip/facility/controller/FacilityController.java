package org.team4p.woorizip.facility.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityDetailResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.service.FacilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/facilities")
public class FacilityController {

	private final FacilityService facilityService;
	
	// 시설 목록 조회
	@GetMapping
	public ResponseEntity<List<FacilityListResponseDTO>> getFacilityList() {
		// TODO : 매개변수 추가 - 토큰 @AuthenticationPrincipal CustomUserDetails userDetails(가칭)
		
		String houseNo = "house001";
		// String houseNo = userDetails(가칭).getHouseNo();
		// TODO : 토큰 이름 정해지면 메서드 호출 코드 수정
		
		List<FacilityListResponseDTO> response = facilityService.getFacilityList(houseNo);
        return ResponseEntity.ok(response);
	}
	
	// 시설 신규 등록
	@PostMapping
	public ResponseEntity<String> registerFacility(@Valid @RequestBody FacilityCreateRequestDTO dto) {
	    facilityService.createFacility(dto);
	    return ResponseEntity.status(HttpStatus.CREATED).body("success");
	}
	
	// 시설 상세 조회
	@GetMapping("/{facilityNo}")
	public ResponseEntity<FacilityDetailResponseDTO> getFacilityDetails(@PathVariable String facilityNo) {
		FacilityDetailResponseDTO response = facilityService.getFacilityDetails(facilityNo);
        return ResponseEntity.ok(response);
	}
}