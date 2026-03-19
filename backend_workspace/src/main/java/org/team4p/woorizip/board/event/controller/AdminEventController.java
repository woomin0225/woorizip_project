package org.team4p.woorizip.board.event.controller;

import java.time.LocalDate;
import java.util.ArrayList;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.board.event.model.service.EventService;
import org.team4p.woorizip.board.post.model.dto.PostDto;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.common.api.SearchRequest;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/event")
public class AdminEventController {

	private final EventService eventService;

	@GetMapping
	public ResponseEntity<ApiResponse<PageResponse<PostDto>>> list(
			@ModelAttribute SearchRequest req) {

		Pageable pageable = req.toPageable();

		int total = eventService.selectListCount();
		ArrayList<PostDto> content = eventService.selectList(pageable);

		int totalPages = (int) Math.ceil((double) total / req.size());

		return ResponseEntity.ok(
				ApiResponse.ok("관리자 목록 조회 성공",
						new PageResponse<>(content, req.page(), req.size(), total, totalPages)));
	}

	@GetMapping("/{postNo}")
	public ResponseEntity<ApiResponse<PostDto>> detail(@PathVariable("postNo") int postNo) {
		return ResponseEntity.ok(ApiResponse.ok("관리자 상세 조회 성공", eventService.selectEvent(postNo)));
	}

	@GetMapping("/search")
	public ResponseEntity<ApiResponse<PageResponse<PostDto>>> search(
			@ModelAttribute @Valid SearchRequest req) {

		if (!req.hasSearchCondition()) {
			return ResponseEntity.badRequest().body(ApiResponse.fail("검색 조건 오류", null));
		}

		Pageable pageable = req.toPageable();

		long total;
		ArrayList<PostDto> list;

		switch (req.type()) {
			case "title" -> {
				total = eventService.selectSearchTitleCount(req.keyword());
				list = eventService.selectSearchTitle(req.keyword(), pageable);
			}
			case "content" -> {
				total = eventService.selectSearchContentCount(req.keyword());
				list = eventService.selectSearchContent(req.keyword(), pageable);
			}
			case "date" -> {
				LocalDate b = req.beginDateOrNull();
				LocalDate e = req.endDateOrNull();

				if (b == null || e == null) {
					return ResponseEntity.badRequest()
							.body(ApiResponse.fail("날짜 범위가 필요합니다.", null));
				}

				total = eventService.selectSearchDateCount(b, e);
				list = eventService.selectSearchDate(b, e, pageable);
			}
			default -> {
				return ResponseEntity.badRequest()
						.body(ApiResponse.fail("type 오류", null));
			}
		}

		int totalPages = (int) Math.ceil((double) total / req.size());

		return ResponseEntity.ok(
				ApiResponse.ok("관리자 검색 성공",
						new PageResponse<>(list, req.page(), req.size(), total, totalPages)));
	}
}
