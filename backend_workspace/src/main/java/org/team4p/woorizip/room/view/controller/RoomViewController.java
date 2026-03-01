package org.team4p.woorizip.room.view.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.room.view.dto.RoomViewResponse;
import org.team4p.woorizip.room.view.service.RoomViewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/room_view")
public class RoomViewController {
	private final RoomViewService rvService;

	private int parseHours(String period) {
		if(period.startsWith("DAY")) return 7 * 24;
		
		return Integer.parseInt(period.substring(3))*24;
	}

	@GetMapping("/popular")
	public List<RoomViewResponse> getPopularRooms(
			@RequestParam(name="period", defaultValue = "DAY1") String period,
			@RequestParam(name="limit", defaultValue = "10") Integer limit
			) {
		int hours = parseHours(period);
		return rvService.selectPopularRoomsLastHours(hours, limit);
	}
}
