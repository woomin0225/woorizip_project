package org.team4p.woorizip.room.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.team4p.woorizip.room.dto.ai.RoomTotalRequest;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;

public interface RoomRepository extends JpaRepository<RoomEntity, String>, RoomRepositoryCustom {
	List<RoomEntity> findAllByHouseNoAndDeletedFalseOrderByRoomName(String houseNo);
	String findUserNoByRoomNo(String roomNo);
	
	@Query(value="""
			SELECT
				r.room_no, r.room_name, r.house_no, h.house_name, h.house_address,
			    r.room_created_at, r.room_updated_at, r.room_deposit, r.room_monthly,
			    r.room_method, r.room_area, r.room_facing, r.room_available_date,
			    r.room_available_date, r.room_abstract, r.room_room_count, r.room_bath_count,
			    r.room_empty_yn, r.room_status, r.room_options,
			    s.image_summary, s.review_summary
			FROM `tb_rooms` AS r
			LEFT JOIN `tb_houses` AS h ON r.house_no = h.house_no
			LEFT JOIN `tb_room_summary` AS s ON r.room_no = s.room_no
			WHERE r.room_no = :roomNo
			"""
			, nativeQuery=true)
	RoomTotalRequest findRoomInfoForTotalSummary(String roomNo);
}
