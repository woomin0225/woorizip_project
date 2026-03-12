package org.team4p.woorizip.room.image.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.image.dto.ai.SimpleImageCaption;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageEntity;

public interface RoomImageRepository extends JpaRepository<RoomImageEntity, Integer>, RoomImageRepositoryCustom {
	List<RoomImageEntity> findAllByRoomNoOrderByRoomImageNo(String roomNo);
	int countByRoomNo(String roomNo);
	RoomImageEntity findTop1ByRoomNoOrderByRoomImageNoAsc(String roomNo);
	
	SimpleImageCaption findAllByRoomNoOrderByRoomImageNoAsc(String roomNo);
}
