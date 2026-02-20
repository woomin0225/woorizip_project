package org.team4p.woorizip.reservation.jpa.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;
import org.team4p.woorizip.user.jpa.entity.UserEntity;

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
	boolean existsByFacilityAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfter(
			FacilityEntity facility,
			LocalDate reservationDate,
			LocalTime reservationStartTime,
			LocalTime reservationEndTime);
	// 기존 예약 수정 시 예약 횟수 검증용 메서드
	long countByUserAndFacilityAndReservationDateAndReservationNoNot(
			UserEntity user,
			FacilityEntity facility,
			LocalDate date,
			String reservationNo);
	// 기존 예약 수정 시 중복 예약 확인용 메서드
	boolean existsByFacilityAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationNoNot(
		    FacilityEntity facility, 
		    LocalDate date, 
		    LocalTime endTime, 
		    LocalTime startTime, 
		    String reservationNo);
}
