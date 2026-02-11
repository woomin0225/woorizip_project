package org.team4p.woorizip.facility.controller;

import java.util.List;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.service.FacilityService;

import lombok.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/facilities")
public class FacilityController {

	private final FacilityService fs;
	
	@GetMapping
	public ResponseEntity<List<FacilityListResponseDTO>> getFacilityList() {
		// TODO : 매개변수 추가 - 토큰 @AuthenticationPrincipal CustomUserDetails userDetails(가칭)
		
		String houseNo = "house001";
		// String houseNo = userDetails(가칭).getHouseNo();
		// TODO : 토큰 이름 정해지면 메서드 호출 코드 수정
		
		List<FacilityListResponseDTO> response = fs.getFacilityList(houseNo);
        return ResponseEntity.ok(response);

	}
}