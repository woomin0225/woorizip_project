package org.team4p.woorizip.room.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.common.api.ApiResponse;
import org.team4p.woorizip.room.dto.RoomDto;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.service.RoomService;
import org.team4p.woorizip.room.type.SearchCriterion;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {
	private final RoomService roomService;
	
	@GetMapping
	public ResponseEntity<ApiResponse<Page<RoomDto>>> searchRooms(@ModelAttribute RoomSearchCondition cond, Pageable pageable, @RequestParam SearchCriterion criterion) {
		// 방 검색
		Page<RoomDto> result = roomService.selectRoomSearch(cond, pageable, criterion);
		return ResponseEntity.status(200).body(ApiResponse.ok("검색 성공", result));
	}
	
}
