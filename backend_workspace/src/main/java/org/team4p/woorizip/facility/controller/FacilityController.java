package org.team4p.woorizip.facility.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.facility.dto.FacilityCategoryCreateRequestDTO;
import org.team4p.woorizip.facility.dto.FacilityCategoryDTO;
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
	@GetMapping({"", "/{houseNo}"})
	public ResponseEntity<List<FacilityListResponseDTO>> getFacilityList(
			@PathVariable String houseNo,
			@AuthenticationPrincipal String currentUserNo) {
		return ResponseEntity.ok(facilityService.getFacilityList(houseNo, currentUserNo));
	}
	
	// 시설 신규 등록
	@PostMapping
	public ResponseEntity<ApiResponse<String>> createFacility(
			@Valid @RequestBody FacilityCreateRequestDTO dto,
			@AuthenticationPrincipal String currentUserNo) {
		facilityService.createFacility(dto, currentUserNo);
        return ResponseEntity.status(HttpStatus.CREATED)
                             .body(ApiResponse.ok("새로운 시설이 정상적으로 등록되었습니다.", "facilityCreateSuccess"));
	}
	
	// 시설 카테고리 등록
	@PostMapping("/categories")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<String>> createFacilityCategory(
			@Valid @RequestBody FacilityCategoryCreateRequestDTO dto) {
		facilityService.createCategory(dto);
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(ApiResponse.ok("새로운 시설 카테고리가 정상적으로 등록되었습니다.", "facilityCategoryCreateSuccess"));
		}
		
	// 시설 카테고리 조회
	@GetMapping("/categories")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<FacilityCategoryDTO>> getFacilityCategory() {
		List<FacilityCategoryDTO> category = facilityService.getFacilityCategory();
		return ResponseEntity.ok(category);
	}
		
	// 시설 카테고리 수정
	@PatchMapping("/categories/{facilityCode}")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<String>> modifyFacilityCategory(
			@PathVariable Integer facilityCode,
			@Valid @RequestBody FacilityCategoryDTO dto) {
		facilityService.modifyFacilityCategory(facilityCode, dto);
        return ResponseEntity.ok(ApiResponse.ok("시설 카테고리의 내용이 정상적으로 수정되었습니다.", "facilityCategoryModifySuccess"));
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
		    @Valid @RequestBody FacilityModifyRequestDTO dto,
		    @AuthenticationPrincipal String currentUserNo) {
		facilityService.modifyFacility(facilityNo, dto, currentUserNo);
        return ResponseEntity.ok(ApiResponse.ok("해당 시설의 정보가 정상적으로 수정되었습니다.", "facilityModifySuccess"));
	}
}