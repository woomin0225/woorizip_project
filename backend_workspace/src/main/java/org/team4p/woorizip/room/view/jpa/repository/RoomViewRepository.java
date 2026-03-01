package org.team4p.woorizip.room.view.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.room.view.dto.RoomViewResponse;
import org.team4p.woorizip.room.view.jpa.entity.RoomViewEntity;
import org.team4p.woorizip.room.view.jpa.entity.RoomViewId;

public interface RoomViewRepository extends JpaRepository<RoomViewEntity, RoomViewId>{
	@Modifying	// 영속성 컨텍스트 거치지 않고 DB에 바로 쿼리 날림
	@Transactional
	@Query(value="""
			INSERT INTO tb_room_view_hourly(room_no, hour_start, view_count)
	        VALUES (:roomNo, :hourStart, 1)
	        ON DUPLICATE KEY UPDATE view_count = view_count + 1
			""", nativeQuery=true)
	int upsertRoomView(@Param("roomNo") String roomNo, @Param("hourStart") LocalDateTime hourStart);	// 조회수 upsert
	
	
	@Query(value="""
	        SELECT rv.room_no, SUM(rv.view_count), r.room_name, h.house_name
	        FROM tb_room_view_hourly as rv
	        JOIN tb_rooms as r ON rv.room_no = r.room_no
			JOIN tb_houses as h ON r.house_no = h.house_no
	        WHERE rv.hour_start >= :cutoff
	        GROUP BY rv.room_no, r.room_name, h.house_name
	        ORDER BY SUM(rv.view_count) DESC
			""", nativeQuery=true)
	List<RoomViewResponse> findPopularSince(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);	// 조회수 높은거 조회
}
