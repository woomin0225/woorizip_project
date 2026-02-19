package org.team4p.woorizip.reservation.service;

import java.util.List;

import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationListResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;

public interface ReservationService {
	void createReservation(ReservationCreateRequestDTO dto, String userNo,  String facilityNo); // 예약 신규 등록
	ReservationDetailResponseDTO getReservationDetails(String reservationNo); // 예약 상세 조회
	List<ReservationListResponseDTO> getReservationList(String userNo, String facilityNo); // 예약 목록 조회
	void modifyReservation(String reservationNo, ReservationModifyRequestDTO dto, String userNo); // 예약 내용 수정
}
