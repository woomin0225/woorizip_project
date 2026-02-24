package org.team4p.woorizip.tour.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.auth.security.principal.CustomUserPrincipal;
import org.team4p.woorizip.common.api.ApiResponse;
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

    /**
     * 투어 조회
     * GET /tour/{tour_no}
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
     * 투어 목록 조회
     * GET /tour/{userNo}
     */
    @GetMapping("/list/me")
    public ResponseEntity<ApiResponse<List<TourDto>>> selectListTour(
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal) {
        List<TourDto> list = tourService.selectListTour(userPrincipal.getUserNo());
        return ResponseEntity.ok(ApiResponse.ok("내 투어 목록 조회 성공", list));
    }

    /**
     * 투어 추가
     * POST /tour/insert/{roomNo}
     */
    @PostMapping("/insert/{roomNo}")
    public ResponseEntity<ApiResponse<Void>> insertTour(
            @PathVariable("roomNo") String roomNo,
            @AuthenticationPrincipal CustomUserPrincipal userPrincipal,
            @RequestBody @Valid TourDto tourDto) {
        
        tourDto.setRoomNo(roomNo);
        tourDto.setUserNo(userPrincipal.getUserNo());
        
        int result = tourService.insertTour(tourDto);
        return result > 0 ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("투어 추가 성공", null))
                          : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 투어 수정
     * POST /tour/update/{roomNo}
     */
    @PostMapping("/update/{tourNo}")
    public ResponseEntity<ApiResponse<Void>> updateTour(
            @PathVariable("tourNo") String tourNo,
            @RequestBody TourDto tourDto) {
        tourDto.setTourNo(tourNo);
        int result = tourService.updateTour(tourDto);
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("투어 수정 성공", null))
                          : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}