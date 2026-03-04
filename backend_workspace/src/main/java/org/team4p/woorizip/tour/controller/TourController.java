package org.team4p.woorizip.tour.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.tour.model.dto.TourDto;
import org.team4p.woorizip.tour.model.service.TourService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.Locale;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/tour")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

    /**
     * 투어 단건 조회
     * GET /api/tour/{tour_no}
     */
    @GetMapping("/{tour_no}")
    public ResponseEntity<ApiResponse<TourDto>> selectTour(@PathVariable("tour_no") String tourNo) {
        TourDto tour = tourService.selectTour(tourNo);
        if (tour == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("투어 정보를 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("투어 조회 성공", tour));
    }

    /**
     * 내 투어 목록 조회
     * GET /api/tour/list/me
     */
    @GetMapping("/list/me")
    public ResponseEntity<ApiResponse<PageResponse<TourDto>>> selectListTour(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<TourDto> body = tourService.selectListTour(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("내 투어 목록 조회 성공", body));
    }

    /**
     * 임대인 투어 목록 조회
     * GET /api/tour/list/owner
     */
    @GetMapping("/list/owner")
    public ResponseEntity<ApiResponse<PageResponse<TourDto>>> selectOwnerListTour(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<TourDto> body = tourService.selectListTourByOwner(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("임대인 투어 목록 조회 성공", body));
    }

    /**
     * 투어 신청 등록
     * POST /api/tour/insert/{roomNo}
     */
    @PostMapping("/insert/{roomNo}")
    public ResponseEntity<ApiResponse<Void>> insertTour(
            @PathVariable("roomNo") String roomNo,
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestBody @Valid TourDto tourDto) {

        tourDto.setRoomNo(roomNo);
        tourDto.setUserNo(userPrincipal.getUserNo());

        int result = tourService.insertTour(tourDto);
        if (result == -1) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail("이미 신청된 투어 시간입니다.", null));
        }
        return result > 0
                ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("투어 추가 성공", null))
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 투어 정보 수정
     * POST /api/tour/update/{tourNo}
     */
    @PostMapping("/update/{tourNo}")
    public ResponseEntity<ApiResponse<Void>> updateTour(
            @PathVariable("tourNo") String tourNo,
            @RequestBody TourDto tourDto) {
        tourDto.setTourNo(tourNo);
        int result = tourService.updateTour(tourDto);
        if (result == -1) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail("이미 신청된 투어 시간입니다.", null));
        }
        return result > 0
                ? ResponseEntity.ok(ApiResponse.ok("투어 수정 성공", null))
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }

    /**
     * 투어 승인/거절 처리
     * POST /api/tour/decision/{tourNo}
     */
    @PostMapping("/decision/{tourNo}")
    public ResponseEntity<ApiResponse<Void>> decideTour(
            @PathVariable("tourNo") String tourNo,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            TourDto existing = tourService.selectTour(tourNo);
            if (existing == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("투어 정보를 찾을 수 없습니다.", null));
            }

            String requestedStatus = body != null ? body.get("status") : null;
            String normalizedStatus = requestedStatus != null
                    ? requestedStatus.trim().toUpperCase(Locale.ROOT)
                    : String.valueOf(existing.getStatus()).toUpperCase(Locale.ROOT);
            String reason = body != null ? body.get("reason") : null;
            if (reason == null || reason.isBlank()) {
                reason = body != null ? body.get("rejectionReason") : null;
            }

            existing.setStatus(normalizedStatus);
            if ("REJECTED".equals(normalizedStatus)) {
                existing.setCanceledReason(reason != null ? reason.trim() : "");
            }

            int result = tourService.updateTour(existing);
            if (result == -1) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.fail("이미 신청된 투어 시간입니다.", null));
            }
            return result > 0
                    ? ResponseEntity.ok(ApiResponse.ok("투어 승인/거절 처리 성공", null))
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.fail("투어 승인/거절 처리 실패", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("투어 승인/거절 처리 중 오류", null));
        }
    }
}
