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
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationListResponseDTO;
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
	public ResponseEntity<ApiResponse<String>> createReservation(
			@Valid @RequestBody ReservationCreateRequestDTO dto,
			@AuthenticationPrincipal CustomUserPrincipal principal,
			@PathVariable(value="facilityNo") String facilityNo) {
		String currentUserNo = (principal != null) ? principal.getUserNo() : null;
		reservationService.createReservation(dto, currentUserNo, facilityNo);
		return ResponseEntity
				.status(HttpStatus.CREATED)
				.body(ApiResponse.ok("귀하의 예약이 정상적으로 등록되었습니다.", "ReservationCreateSuccess"));
	}

	// 예약 상세 조회
	@GetMapping("api/reservations/{reservationNo}")
	public ResponseEntity<ReservationDetailResponseDTO> getReservationDetails(
			@PathVariable(value="reservationNo") String reservationNo) {
		ReservationDetailResponseDTO response = reservationService.getReservationDetails(reservationNo);
		return ResponseEntity.ok(response);

	}

	// 예약 목록 조회
	@GetMapping({"/api/reservations", "/api/facilities/{facilityNo}/reservations"})
	public ResponseEntity<List<ReservationListResponseDTO>> getReservationList(
			@AuthenticationPrincipal CustomUserPrincipal principal,
			@PathVariable(value = "facilityNo", required = false) String facilityNo) {
		String currentUserNo = (principal != null) ? principal.getUserNo() : null;
		return ResponseEntity.ok(reservationService.getReservationList(currentUserNo, facilityNo));
	}

	// 예약 내용 수정
	@PatchMapping("api/reservations/{reservationNo}")
	public ResponseEntity<ApiResponse<String>> modifyReservation(
			@PathVariable(value="reservationNo")  String reservationNo,
			@Valid @RequestBody ReservationModifyRequestDTO dto,
			@AuthenticationPrincipal CustomUserPrincipal principal) {
		String currentUserNo = (principal != null) ? principal.getUserNo() : null;
		reservationService.modifyReservation(reservationNo, dto, currentUserNo);
		return ResponseEntity.ok(ApiResponse.ok("예약 내용이 정상적으로 수정되었습니다.", "reservationModifySuccess"));
	}
}
