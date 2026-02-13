package org.team4p.woorizip.wishlist.controller;

import java.time.LocalDate;
import java.util.ArrayList;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.wishlist.model.dto.WishlistDto;
import org.team4p.woorizip.wishlist.model.service.WishlistService;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * 찜하기 등록
     * POST /api/wishlist/add/{roomNo}
     */
    @PostMapping("/add/{roomNo}")
    public ResponseEntity<ApiResponse<Void>> create(@RequestBody @Valid WishlistDto wishlistDto) {
        // roomNo를 경로로 받지만 DTO에도 세팅이 필요한 경우 처리 로직 필요 (현재는 DTO 그대로 전달)
        int result = wishlistService.insertWishlist(wishlistDto);
        if (result > 0) {
            return ResponseEntity.status(201).body(ApiResponse.ok("찜 등록 성공", null));
        }
        return ResponseEntity.status(409).body(ApiResponse.fail("이미 찜한 항목이거나 등록 실패", null));
    }

    /**
     * 찜 상세보기 (단건 조회)
     * GET /api/wishlist/detail/{wishNo}
     */
    @GetMapping("/detail/{wishNo}")
    public ResponseEntity<ApiResponse<WishlistDto>> detail(@PathVariable("wishNo") String wishNo) {
        WishlistDto dto = wishlistService.selectWishlist(wishNo);
        if (dto != null) {
            return ResponseEntity.ok(ApiResponse.ok("찜 상세 조회 성공", dto));
        }
        return ResponseEntity.status(404).body(ApiResponse.fail("해당 찜 항목을 찾을 수 없습니다.", null));
    }

    /**
     * 찜 삭제 (단건 삭제)
     * DELETE /api/wishlist/delete/{wishNo}
     */
    @DeleteMapping("/delete/{wishNo}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("wishNo") String wishNo) {
        int result = wishlistService.deleteWishlist(wishNo);
        if (result > 0) {
            return ResponseEntity.ok(ApiResponse.ok("찜 삭제 성공", null));
        }
        return ResponseEntity.status(500).body(ApiResponse.fail("찜 삭제 실패", null));
    }

    /**
     * 찜 전체 삭제 (내 찜 목록 비우기)
     * DELETE /api/wishlist/delete/all/{userNo}
     */
    @DeleteMapping("/delete/all/{userNo}")
    public ResponseEntity<ApiResponse<Void>> deleteAll(@PathVariable("userNo") String userNo) {
        int result = wishlistService.deleteWishlist(userNo);
        if (result >= 0) { // 0이어도 삭제 수행은 성공으로 간주 (목록이 비어있던 경우)
            return ResponseEntity.ok(ApiResponse.ok("찜 전체 삭제 성공", null));
        }
        return ResponseEntity.status(500).body(ApiResponse.fail("찜 전체 삭제 실패", null));
    }

    /**
     * 내 찜 목록 조회 (페이징)
     * GET /api/wishlist/{userNo}?page=1&size=10
     */
    @GetMapping("/{userNo}")
    public ResponseEntity<ApiResponse<PageResponse<WishlistDto>>> myWishlist(
            @PathVariable("userNo") String userNo,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;

        Pageable pageable = PageRequest.of(page - 1, size);

        long totalElements = wishlistService.selectMyListCount(userNo);
        int totalPages = (totalElements == 0) ? 0 : (int) Math.ceil((double) totalElements / size);

        ArrayList<WishlistDto> list = wishlistService.selectMyList(userNo, pageable);

        PageResponse<WishlistDto> body = new PageResponse<>(list, page, size, totalElements, totalPages);
        return ResponseEntity.ok(ApiResponse.ok("내 찜 목록 조회 성공", body));
    }
}