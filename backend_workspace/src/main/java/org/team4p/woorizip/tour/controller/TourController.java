package org.team4p.woorizip.tour.controller;

import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.ai.config.AiServerProperties;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.tour.model.dto.InternalTourApplyRequest;
import org.team4p.woorizip.tour.model.dto.TourDto;
import org.team4p.woorizip.tour.model.service.TourService;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/tour")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;
    private final AiServerProperties aiServerProperties;
    private final UserRepository userRepository;

    @GetMapping("/{tour_no}")
    public ResponseEntity<ApiResponse<TourDto>> selectTour(@PathVariable("tour_no") String tourNo) {
        TourDto tour = tourService.selectTour(tourNo);
        if (tour == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("투어 정보를 찾을 수 없습니다.", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("투어 조회 성공", tour));
    }

    @GetMapping("/list/me")
    public ResponseEntity<ApiResponse<PageResponse<TourDto>>> selectListTour(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<TourDto> body = tourService.selectListTour(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("내 투어 목록 조회 성공", body));
    }

    @GetMapping("/list/owner")
    public ResponseEntity<ApiResponse<PageResponse<TourDto>>> selectOwnerListTour(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "8") int size) {
        PageResponse<TourDto> body = tourService.selectListTourByOwner(userPrincipal.getUserNo(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("소유자 투어 목록 조회 성공", body));
    }

    @PostMapping("/insert/{roomNo}")
    public ResponseEntity<ApiResponse<Void>> insertTour(
            @PathVariable("roomNo") String roomNo,
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestBody @Valid TourDto tourDto) {
        try {
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
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail(e.getMessage(), null));
        }
    }

    // CODEX-AZURE-INTERNAL-TOUR-START
    @PostMapping("/internal/insert/{roomNo}")
    public ResponseEntity<ApiResponse<Void>> insertTourInternal(
            @PathVariable("roomNo") String roomNo,
            @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
            @RequestBody @Valid InternalTourApplyRequest req) {
        if (!StringUtils.hasText(apiKey) || !apiKey.trim().equals(resolveInternalApiKey())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("내부 호출 인증에 실패했습니다.", null));
        }

        UserEntity user = findUserByNameAndPhone(req.getUserName(), req.getUserPhone());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("일치하는 사용자 정보를 찾을 수 없습니다.", null));
        }

        try {
            TourDto tourDto = new TourDto();
            tourDto.setRoomNo(roomNo);
            tourDto.setUserNo(user.getUserNo());
            tourDto.setVisitDate(req.getVisitDate());
            tourDto.setVisitTime(req.getVisitTime());
            tourDto.setMessage(req.getMessage());
            tourDto.setStatus("PENDING");

            int result = tourService.insertTour(tourDto);
            if (result == -1) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.fail("이미 신청된 투어 시간입니다.", null));
            }
            return result > 0
                    ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("투어 추가 성공", null))
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.fail("투어 신청 저장에 실패했습니다.", null));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail(e.getMessage(), null));
        }
    }
    // CODEX-AZURE-INTERNAL-TOUR-END

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
                    : ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(ApiResponse.fail("투어 승인/거절 처리 실패", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("투어 승인/거절 처리 중 오류", null));
        }
    }

    private String resolveInternalApiKey() {
        return StringUtils.hasText(aiServerProperties.getInternalApiKey())
                ? aiServerProperties.getInternalApiKey().trim()
                : "local-dev-key";
    }

    private UserEntity findUserByNameAndPhone(String name, String phone) {
        String normalizedName = name != null ? name.trim() : "";
        String normalizedPhone = phone != null ? phone.replaceAll("\\D", "") : "";
        UserEntity user = userRepository.findByNameAndPhone(normalizedName, normalizedPhone);
        if (user != null) {
            return user;
        }
        String dashedPhone = normalizedPhone.replaceFirst("^(010)(\\d{4})(\\d{4})$", "$1-$2-$3");
        if (!dashedPhone.equals(normalizedPhone)) {
            return userRepository.findByNameAndPhone(normalizedName, dashedPhone);
        }
        return null;
    }
}
