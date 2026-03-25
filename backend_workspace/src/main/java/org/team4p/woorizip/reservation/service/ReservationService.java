package org.team4p.woorizip.reservation.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationListResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationStatsDTO;

public interface ReservationService {
	void createReservation(ReservationCreateRequestDTO dto, String userNo,  String facilityNo); // 예약 신규 등록
	List<ReservationListResponseDTO> selectList(String facilityNo, LocalDate date); // 예약 신규 시 기존 예약 확인용 메서드
	int selectListCount(String userNo, String facilityNo, String targetUserNo); // 예약 목록 페이지 조회
	List<ReservationListResponseDTO> selectList(Pageable pageable, String userNo, String facilityNo, String targetUserNo); // 예약 목록 조회
	ReservationDetailResponseDTO selectReservation(String reservationNo); // 예약 상세 조회
	void modifyReservation(String reservationNo, ReservationModifyRequestDTO dto, String userNo); // 예약 내용 수정
	List<ReservationStatsDTO> analyzeReservation(String facilityNo); // 이용 통게 분석 데이터 조회
}
