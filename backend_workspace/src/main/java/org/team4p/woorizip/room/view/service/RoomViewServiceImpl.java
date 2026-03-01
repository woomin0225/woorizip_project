package org.team4p.woorizip.room.view.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;
import org.team4p.woorizip.room.image.jpa.repository.RoomImageRepository;
import org.team4p.woorizip.room.view.dto.RoomViewResponse;
import org.team4p.woorizip.room.view.jpa.repository.RoomViewRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@RequestMapping("/api/roomView")
public class RoomViewServiceImpl implements RoomViewService {

	private final RoomViewRepository rvRepository;
	private final RoomImageRepository riRepository;
	
	private static final ZoneId KST = ZoneId.of("Asia/Seoul");
	
	@Override
	public void upsertRoomView(String houseNo) {
		LocalDateTime hourStart = LocalDateTime.now(KST).truncatedTo(ChronoUnit.HOURS);
		rvRepository.upsertRoomView(houseNo, hourStart);
	}

	@Override
	public List<RoomViewResponse> selectPopularRoomsLastHours(int hours, int limit) {
		LocalDateTime cutoff = LocalDateTime.now(KST).minusHours(hours).truncatedTo(ChronoUnit.HOURS);
		List<RoomViewResponse> list = rvRepository.findPopularSince(cutoff, PageRequest.of(0, limit));
		
		String imageName = null;
		for(RoomViewResponse res : list) {
			 RoomImageEntity row = riRepository.findTop1ByRoomNoOrderByRoomImageNoAsc(res.getRoomNo());
			 if(row == null) continue;
			 imageName = row.getRoomStoredImageName();
			 res.setRepImageName(imageName);
		}
		
		return list;
	}

}
