package org.team4p.woorizip.reservation.service;

import java.util.List;

import org.team4p.woorizip.facility.dto.FacilityListResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;

public interface ReservationService {
	void createReservation(ReservationCreateRequestDTO dto, String userNo); // 예약 신규 등록
	ReservationDetailResponseDTO getReservationDetails(String reservationNo); // 예약 상세 조회
	List<FacilityListResponseDTO> getReservationList(String userNo, String facilityNo); // 예약 목록 조회
	void modifyReservation(String reservationNo, ReservationModifyRequestDTO dto); // 예약 내용 수정
}
