package org.team4p.woorizip.house.view.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.house.view.dto.HouseViewDto;
import org.team4p.woorizip.house.view.jpa.repository.HouseViewRepository;

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
	public List<HouseViewDto> selectPopularHousesLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<HouseViewDto> list = new ArrayList<>();
		hvRepository.findPopularSince(cutoff, PageRequest.of(0, limit)).forEach(entity->list.add(entity.toDto()));;
		return list;
	}
	
}
