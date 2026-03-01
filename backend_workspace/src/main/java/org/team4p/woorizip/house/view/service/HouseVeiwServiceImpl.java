package org.team4p.woorizip.house.view.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.house.view.dto.HouseViewRow;
import org.team4p.woorizip.house.view.repository.HouseViewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseVeiwServiceImpl implements HouseViewService {
	
private final HouseViewRepository hvRepository;
	
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	
	@Override
	public void upsertHouseView(String houseNo) {
		LocalDateTime hourStart = LocalDateTime.now(KST).truncatedTo(ChronoUnit.HOURS);
		hvRepository.upsertHouseView(houseNo, hourStart);
	}

	@Override
	public List<HouseViewRow> selectPopularHousesLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		return hvRepository.findPopularSince(cutoff, PageRequest.of(0, limit));
	}
	
}
