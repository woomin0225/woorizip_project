package org.team4p.woorizip.house.view.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.house.view.dto.HouseViewResponse;
import org.team4p.woorizip.house.view.jpa.entity.HouseViewEntity;
import org.team4p.woorizip.house.view.jpa.entity.HouseViewId;

public interface HouseViewRepository extends JpaRepository<HouseViewEntity, HouseViewId> {
	@Modifying	// 영속성 컨텍스트 거치지 않고 DB에 바로 쿼리 날림
	@Transactional
	@Query(value="""
			INSERT INTO tb_house_view_hourly(house_no, hour_start, view_count)
	        VALUES (:houseNo, :hourStart, 1)
	        ON DUPLICATE KEY UPDATE view_count = view_count + 1
			""", nativeQuery=true)
	int upsertHouseView(@Param("houseNo") String houseNo, @Param("hourStart") LocalDateTime hourStart);	// 조회수 upsert
	
	
	@Query(value="""
			SELECT hv.house_no, SUM(hv.view_count), h.house_name, h.house_address
	        FROM tb_house_view_hourly as hv
	        JOIN tb_houses as h ON hv.house_no = h.house_no
	        WHERE hv.hour_start >= :cutoff
	        GROUP BY hv.house_no
	        ORDER BY SUM(hv.view_count) DESC
			""", nativeQuery=true)
	List<HouseViewResponse> findPopularSince(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);	// 조회수 높은거 조회
}