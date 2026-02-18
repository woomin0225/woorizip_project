package org.team4p.woorizip.reservation.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;
import org.team4p.woorizip.reservation.service.ReservationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequiredArgsConstructor
public class ReservationController {

	private final ReservationService reservationService;
	
	// 예약 신규 등록
	@PostMapping("api/facilities/{facilityNo}/reservations")
	public ResponseEntity<ApiResponse<String>> createFacility(
			@Valid @RequestBody ReservationCreateRequestDTO dto,
			@AuthenticationPrincipal String currentUserNo) {
		try {
			reservationService.createReservation(dto, currentUserNo);
	        return ResponseEntity.status(HttpStatus.CREATED)
	                             .body(ApiResponse.ok("예약 등록 성공", "ReservationCreateSuccess"));
	    } catch (Exception e) {
	        log.error("[createReservation Error] facilityNo: {}, Error: {}", dto.getFacilityNo(), e.getMessage(), e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body(ApiResponse.fail("예약 등록 실패", "ReservationCreateFail"));
	    }
	}
	
	// 예약 상세 조회
	@GetMapping("api/reservations/{reservationNo}")
	public ResponseEntity<ReservationDetailResponseDTO> getReservationDetails(@PathVariable String reservationNo) {
			ReservationDetailResponseDTO response = reservationService.getReservationDetails(reservationNo);
	        return ResponseEntity.ok(response);
		
	}
	
	// 예약 목록 조회
	@GetMapping("/api/facilities/{facilityNo}/reservations")
	public ResponseEntity<List<FacilityListResponseDTO>> getReservationList(
	        @AuthenticationPrincipal String userNo,
	        @PathVariable String facilityNo) {	    
	    return ResponseEntity.ok(reservationService.getReservationList(userNo, facilityNo));
	}
	
	// 예약 내용 수정
	@PatchMapping("api/reservations/{reservationNo}")
	public ResponseEntity<ApiResponse<String>> modifyReservation(
			@PathVariable String reservationNo,
		    @RequestBody ReservationModifyRequestDTO dto) {
		try {
	        reservationService.modifyReservation(reservationNo, dto);
	        return ResponseEntity.ok(ApiResponse.ok("예약 내용 수정 성공", "reservationModifySuccess"));
	    } catch (Exception e) {
	        log.error("[modifyReservation Error] ReservationNo: {}, Error: {}", dto.getReservationNo(), e.getMessage(), e);
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                             .body(ApiResponse.fail("예약 내용 수정 실패", "ReservationModifyFail"));
	    }
	}
}
