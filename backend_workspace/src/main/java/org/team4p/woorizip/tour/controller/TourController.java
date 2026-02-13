package org.team4p.woorizip.tour.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
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
    public ResponseEntity<ApiResponse<TourDto>> selectTour(@PathVariable("tour_no") Long tour_no) {
        TourDto tour = tourService.selectTour(tour_no);
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
    @GetMapping("/list/{userNo}")
    public ResponseEntity<ApiResponse<List<TourDto>>> selectListTour(@PathVariable("userNo") Long userNo) {
        List<TourDto> list = tourService.selectListTour(userNo);
        return ResponseEntity.ok(ApiResponse.ok("투어 목록 조회 성공", list));
    }

    /**
     * 투어 추가
     * POST /tour/insert/{room_no}
     */
    @PostMapping("/insert/{room_no}")
    public ResponseEntity<ApiResponse<Void>> insertTour(
            @PathVariable("room_no") Long room_no,
            @RequestBody @Valid TourDto tourDto) {
        tourDto.setRoomNo(room_no);
        int result = tourService.insertTour(tourDto);
        return result > 0 ? ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("투어 추가 성공", null))
                          : ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    /**
     * 투어 수정
     * POST /tour/update/{room_no}
     */
    @PostMapping("/update/{room_no}")
    public ResponseEntity<ApiResponse<Void>> updateTour(
            @PathVariable("room_no") Long room_no,
            @RequestBody TourDto tourDto) {
        tourDto.setRoomNo(room_no);
        int result = tourService.updateTour(tourDto);
        return result > 0 ? ResponseEntity.ok(ApiResponse.ok("투어 수정 성공", null))
                          : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}