package org.team4p.woorizip.facility.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.facility.dto.FacilityCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityDetailResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.facility.dto.FacilityModifyRequestDTO;
import org.team4p.woorizip.facility.service.FacilityService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/facilities")
public class FacilityController {

	private final FacilityService facilityService;
	
	// 시설 목록 조회
	@GetMapping
	public ResponseEntity<List<FacilityListResponseDTO>> getFacilityList(
			@AuthenticationPrincipal String currentUserNo) {
		return ResponseEntity.ok(facilityService.getFacilityList(currentUserNo));
	}
	
	// 시설 신규 등록
	@PostMapping
	public ResponseEntity<ApiResponse<String>> createFacility(
			@Valid @RequestBody FacilityCreateRequestDTO dto,
			@AuthenticationPrincipal String currentUserNo) {
		try {
			facilityService.createFacility(dto, currentUserNo);
	        return ResponseEntity.status(HttpStatus.CREATED)
	                             .body(ApiResponse.ok("시설 정보 등록 성공", "createSuccess"));
	    } catch (Exception e) {
	        log.error("[createFacility Error] facilityName: {}, Error: {}", dto.getFacilityName(), e.getMessage(), e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body(ApiResponse.fail("시설 등록 실패", "facilityCreateFail"));
	    }
	}
	
	// 시설 상세 조회
	@GetMapping("/{facilityNo}")
	public ResponseEntity<FacilityDetailResponseDTO> getFacilityDetails(@PathVariable String facilityNo) {
		FacilityDetailResponseDTO response = facilityService.getFacilityDetails(facilityNo);
        return ResponseEntity.ok(response);
	}
	
	// 시설 정보 수정
	@PatchMapping("/{facilityNo}")
	public ResponseEntity<ApiResponse<String>> modifyFacility(
			@PathVariable String facilityNo,
		    @RequestBody FacilityModifyRequestDTO dto) {
	    try {
	        facilityService.modifyFacility(facilityNo, dto);
	        return ResponseEntity.ok(ApiResponse.ok("시설 정보 수정 성공", "modifySuccess"));
	    } catch (Exception e) {
	        log.error("Facility Modify Error FacilityName: {}, Error: {}", dto.getFacilityName(), e.getMessage(), e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body(ApiResponse.fail("시설 수정 실패", "modifyFail"));
	    }
	}
}