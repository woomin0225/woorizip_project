package org.team4p.woorizip.house.view.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.house.view.dto.HouseViewResponse;
import org.team4p.woorizip.house.view.service.HouseViewService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/house_view")
public class HouseViewController {
	private final HouseViewService hvService;

	private int parseHours(String period) {
		return switch (period) {
			case "DAY1" -> 24;
			case "DAY7" -> 24 * 7;
			case "DAY30" -> 24 * 30;
			default -> 24 * 7;
		};
	}

	@GetMapping("/popular")
	public List<HouseViewResponse> getPopularHouses(
			@RequestParam(defaultValue = "DAY1") String period,
			@RequestParam(defaultValue = "10") Integer limit
			) {
		int hours = parseHours(period);
		return hvService.selectPopularHousesLastHours(hours, limit);
	}
}
