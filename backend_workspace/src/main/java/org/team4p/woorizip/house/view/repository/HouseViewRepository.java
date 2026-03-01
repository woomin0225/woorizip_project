package org.team4p.woorizip.house.view.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.house.view.dto.HouseViewRow;

public interface HouseViewRepository extends Repository<Object, Long> {
	@Modifying	// 영속성 컨텍스트 거치지 않고 DB에 바로 쿼리 날림
	@Transactional
	@Query(value="""
			INSERT INTO tb_house_view_hourly(house_no, hour_start, view_count)
	        VALUES (:houseNo, :hourStart, 1)
	        ON DUPLICATE KEY UPDATE view_count = view_count + 1
			""", nativeQuery=true)
	int upsertHouseView(@Param("houseNo") String houseNo, @Param("hourStart") LocalDateTime hourStart);	// 조회수 upsert
	
	
	@Query(value="""
			SELECT h.house_no AS id, SUM(h.view_count) AS viewCount
	        FROM tb_house_view_hourly h
	        WHERE h.hour_start >= :cutoff
	        GROUP BY h.house_no
	        ORDER BY viewCount DESC
			""", nativeQuery=true)
	List<HouseViewRow> findPopularSince(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);	// 조회수 높은거 조회
}
