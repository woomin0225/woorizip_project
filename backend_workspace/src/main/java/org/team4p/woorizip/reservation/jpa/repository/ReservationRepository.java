package org.team4p.woorizip.reservation.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;

public interface ReservationRepository  extends JpaRepository<ReservationEntity, String> {
	// 임대인 예약 목록 조회용 메서드
	List<ReservationEntity> findByFacility_FacilityNo(String facilityNo);
	// 임차인 예약 목록 조회용 메서드
	List<ReservationEntity> findByUser_UserNo(String userNo);
}
