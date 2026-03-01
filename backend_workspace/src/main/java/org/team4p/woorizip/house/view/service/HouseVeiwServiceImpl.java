package org.team4p.woorizip.house.view.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.team4p.woorizip.house.image.jpa.repository.HouseImageRepository;
import org.team4p.woorizip.house.view.dto.HouseViewResponse;
import org.team4p.woorizip.house.view.jpa.repository.HouseViewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HouseVeiwServiceImpl implements HouseViewService {
	
	private final HouseViewRepository hvRepository;
	private final HouseImageRepository hiRepository;
	
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	
	@Override
	public void upsertHouseView(String houseNo) {
		LocalDateTime hourStart = LocalDateTime.now(KST).truncatedTo(ChronoUnit.HOURS);
		hvRepository.upsertHouseView(houseNo, hourStart);
	}

	@Override
	public List<HouseViewResponse> selectPopularHousesLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<HouseViewResponse> list = hvRepository.findPopularSince(cutoff, PageRequest.of(0, limit));
		
		String imageName = null;
		for(HouseViewResponse res : list) {
			 imageName = hiRepository.findTop1ByHouseNoOrderByHouseImageNoAsc(res.getHouseNo());
			 res.setRepImageName(imageName);
		}
		
		return list;
	}
	
}
