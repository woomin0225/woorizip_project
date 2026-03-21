package org.team4p.woorizip.room.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.jpa.entity.RoomFinalSummaryEntity;

public interface RoomFinalSummaryRepository extends JpaRepository<RoomFinalSummaryEntity, String> {
	List<RoomFinalSummaryEntity> findAllBySummaryStatus(String status);
}
