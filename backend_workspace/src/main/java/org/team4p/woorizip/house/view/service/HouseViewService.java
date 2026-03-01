package org.team4p.woorizip.house.view.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.house.view.dto.HouseViewResponse;

public interface HouseViewService {
	void upsertHouseView(String houseNo);	// 조회수 1 증가 (정각으로 내림)
	List<HouseViewResponse> selectPopularHousesLastHours(int hours, int limit);	// 최근 n시간 인기 조회
}
