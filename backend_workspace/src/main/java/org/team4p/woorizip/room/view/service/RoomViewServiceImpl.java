package org.team4p.woorizip.room.view.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.team4p.woorizip.room.view.dto.RoomViewDto;
import org.team4p.woorizip.room.view.jpa.repository.RoomViewRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/roomView")
public class RoomViewServiceImpl implements RoomViewService {

	private final RoomViewRepository rvRepository;
	
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	
	@Override
	public void upsertRoomView(String houseNo) {
		LocalDateTime hourStart = LocalDateTime.now(KST).truncatedTo(ChronoUnit.HOURS);
		rvRepository.upsertRoomView(houseNo, hourStart);
	}

	@Override
	public List<RoomViewDto> selectPopularRoomsLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<RoomViewDto> list = new ArrayList<>();
		rvRepository.findPopularSince(cutoff, PageRequest.of(0, limit)).forEach(entity->list.add(entity.toDto()));;
		return list;
	}

}
