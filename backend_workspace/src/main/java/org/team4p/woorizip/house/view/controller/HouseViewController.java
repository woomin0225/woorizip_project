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
		if(period.startsWith("DAY")) return Integer.parseInt(period.substring(3))*24;
		
		return 7*24;
	}

	@GetMapping("/popular")
	public List<HouseViewResponse> getPopularHouses(
			@RequestParam(name="period", defaultValue = "DAY1") String period,
			@RequestParam(name="limit", defaultValue = "10") Integer limit
			) {
		int hours = parseHours(period);
		return hvService.selectPopularHousesLastHours(hours, limit);
	}
}
