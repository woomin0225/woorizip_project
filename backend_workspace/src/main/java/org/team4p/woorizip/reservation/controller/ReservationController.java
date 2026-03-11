package org.team4p.woorizip.reservation.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
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
	@PostMapping("/api/facilities/{facilityNo}/reservations")
	public ResponseEntity<ApiResponse<String>> createReservation(
			@Valid @RequestBody ReservationCreateRequestDTO dto,
			@AuthenticationPrincipal CustomUserPrincipal principal,
			@PathVariable(value="facilityNo") String facilityNo) {
		String currentUserNo = (principal != null) ? principal.getUserNo() : null;
		reservationService.createReservation(dto, currentUserNo, facilityNo);
		return ResponseEntity.ok(ApiResponse.ok("예약이 성공적으로 등록되었습니다.", "reservationCreateSuccess"));

	}
	
	@GetMapping("/api/facilities/{facilityNo}/reservations/check")
	public ResponseEntity<ApiResponse<List<ReservationListResponseDTO>>> getAvailability(
	        @PathVariable("facilityNo") String facilityNo,
	        @RequestParam(name = "date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
	    List<ReservationListResponseDTO> list = reservationService.selectList(facilityNo, date);
	    return ResponseEntity.ok(ApiResponse.ok("해당 일자 예약 목록 조회 성공", list));
	}

	// 예약 목록 조회
	@GetMapping({"/api/reservations", "/api/facilities/{facilityNo}/reservations"})
	public ResponseEntity<ApiResponse<PageResponse<ReservationListResponseDTO>>> getReservationList(
			@RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "reservationDate,reservationStartTime") String sort,
            @RequestParam(name = "direct", defaultValue = "DESC") String direct,
			@AuthenticationPrincipal CustomUserPrincipal principal,
			@PathVariable(value = "facilityNo", required = false) String facilityNo) {
		String currentUserNo = (principal != null) ? principal.getUserNo() : null;
		
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Sort.Direction direction = "ASC".equalsIgnoreCase(direct) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String[] sortFields = sort.split(",");
        Pageable pageable = PageRequest.of(page - 1, size, direction, sortFields);

        long totalElements = reservationService.selectListCount(currentUserNo, facilityNo);
        int totalPages = (totalElements == 0) ? 0 : (int) Math.ceil((double) totalElements / size);

        List<ReservationListResponseDTO> list = reservationService.selectList(pageable, currentUserNo, facilityNo);

        PageResponse<ReservationListResponseDTO> body = new PageResponse<>(list, page, size, totalElements, totalPages);
        return ResponseEntity.ok(ApiResponse.ok("예약 목록 조회 성공", body));
	}

	// 예약 상세 조회
	@GetMapping("api/reservations/{reservationNo}")
	public ResponseEntity<ApiResponse<ReservationDetailResponseDTO>> getReservationDetails(
			@PathVariable(value="reservationNo") String reservationNo) {
		ReservationDetailResponseDTO body = reservationService.selectReservation(reservationNo);
		return ResponseEntity.ok(ApiResponse.ok("예약 정보 조회 성공", body));
	}

	// 예약 내용 수정
	@PatchMapping("/api/reservations/{reservationNo}")
	public ResponseEntity<ApiResponse<String>> modifyReservation(
			@PathVariable(value="reservationNo")  String reservationNo,
			@Valid @RequestBody ReservationModifyRequestDTO dto,
			@AuthenticationPrincipal CustomUserPrincipal principal) {
		String currentUserNo = (principal != null) ? principal.getUserNo() : null;
		reservationService.modifyReservation(reservationNo, dto, currentUserNo);
		return ResponseEntity.ok(ApiResponse.ok("예약 내용이 정상적으로 수정되었습니다.", "reservationModifySuccess"));
	}
}
