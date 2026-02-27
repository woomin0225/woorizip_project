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

@Slf4j
@RestController
@RequestMapping("/api/tour")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

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
}
