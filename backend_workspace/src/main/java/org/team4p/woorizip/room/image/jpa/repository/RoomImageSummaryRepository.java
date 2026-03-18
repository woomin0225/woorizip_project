package org.team4p.woorizip.room.image.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.image.jpa.entity.RoomImageSummaryEntity;

public interface RoomImageSummaryRepository extends JpaRepository<RoomImageSummaryEntity, String> {
	List<RoomImageSummaryEntity> findAllBySummaryStatus(String status);
}
