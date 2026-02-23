package org.team4p.woorizip.reservation.jpa.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;
import org.team4p.woorizip.user.jpa.entity.UserEntity;

import jakarta.transaction.Transactional;

public interface ReservationRepository  extends JpaRepository<ReservationEntity, String> {
	// 임대인 예약 목록 조회용 메서드
	List<ReservationEntity> findByFacility_FacilityNo(String facilityNo);
	// 임차인 예약 목록 조회용 메서드
	List<ReservationEntity> findByUser_UserNo(String userNo);
	// 신규 예약 시 예약 횟수 검증용 메서드
	long countByUserAndFacilityAndReservationDate(
		    UserEntity user, 
		    FacilityEntity facility, 
		    LocalDate date);
	// 신규 예약 시 중복 예약 확인용 메서드
	boolean existsByFacility_FacilityNoAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfter(
			String facilityNo,
			LocalDate date,
			LocalTime endTime,
			LocalTime startTime);
	// 기존 예약 수정 시 예약 횟수 검증용 메서드
	long countByUser_UserNoAndFacility_FacilityNoAndReservationDateAndReservationNoNot(
			String userNo,
			String facilityNo,
			LocalDate date,
			String reservationNo);
	// 기존 예약 수정 시 중복 예약 확인용 메서드
	boolean existsByFacility_FacilityNoAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationNoNot(
		    String facilityNo, 
		    LocalDate date,
		    LocalTime endTime, 
		    LocalTime startTime,
		    String reservationNo);
	// facilityStatus를 modify할 경우 막아둔 예약을 모두 제거하는 메서드
	@Transactional
	@Modifying
	void deleteByFacility_FacilityNoAndUser_UserNo(String facilityNo, String userNo);
	// facilityStatus == FacilityStatus.UNAVAILABLE 시 해당 날짜에 예약이 있는지 조회하는 메서드
	List<ReservationEntity> findByFacility_FacilityNoAndReservationDateBetween(
		    String facilityNo,
		    LocalDate startDate,
		    LocalDate endDate);
}
