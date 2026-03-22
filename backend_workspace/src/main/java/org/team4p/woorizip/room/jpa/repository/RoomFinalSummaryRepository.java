package org.team4p.woorizip.room.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.room.jpa.entity.RoomFinalSummaryEntity;

public interface RoomFinalSummaryRepository extends JpaRepository<RoomFinalSummaryEntity, String> {
	List<RoomFinalSummaryEntity> findAllBySummaryStatus(String status);

	@Transactional
	@Modifying
	@Query("""
			update RoomFinalSummaryEntity r
			   set r.summaryStatus = :processing,
			       r.lastErrorMessage = null,
			       r.updatedAt = :now
			 where r.roomNo = :roomNo
			   and r.summaryStatus = :pending
			""")
	int claimProcessing(
			@Param("roomNo") String roomNo,
			@Param("pending") String pending,
			@Param("processing") String processing,
			@Param("now") LocalDateTime now
	);
}
