package org.team4p.woorizip.reservation.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationListResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;
import org.team4p.woorizip.reservation.enums.ReservationStatus;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;
import org.team4p.woorizip.reservation.jpa.repository.ReservationRepository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

	private final FacilityRepository facilityRepository;
	private final ReservationRepository reservationRepository;
	private final UserRepository userRepository;

	// 예약 신규 등록
	@Override
	@Transactional
	public void createReservation(ReservationCreateRequestDTO dto, String userNo, String facilityNo) {
		// 시설 번호 가져오기
		FacilityEntity facility = facilityRepository.findById(facilityNo)
				.orElseThrow(() -> new NotFoundException("no facility data exists"));

		// 유저 번호 가져오기
		UserEntity user = userRepository.findById(userNo)
				.orElseThrow(() -> new NotFoundException("no user data exists"));
		
		// 권한 확인하기
	   

		// 예약 내용 저장하기
		ReservationEntity reservation = ReservationEntity
				.builder()
				.reservationNo(UUID.randomUUID().toString())
				.facility(facility)
				.user(user)
				.reservationName(dto.getReservationName())
				.reservationPhone(dto.getReservationPhone())
				.reservationDate(dto.getReservationDate())
				.reservationStartTime(dto.getReservationStartTime())
				.reservationEndTime(dto.getReservationEndTime())
				.reservationStatus(ReservationStatus.APPROVED)
				.build();
		reservationRepository.save(reservation);
	}

	// 예약 상세 조회
	@Override
	@Transactional(readOnly = true)
	public ReservationDetailResponseDTO getReservationDetails(String reservationNo) {
		return reservationRepository.findById(reservationNo)
				.map(ReservationDetailResponseDTO::from)
				.orElseThrow(() -> new NotFoundException("no reservation data exists"));
	}

	// 예약 목록 조회
	@Override
	@Transactional(readOnly = true)
	public List<ReservationListResponseDTO> getReservationList(String userNo, String facilityNo) {
		// 임차인
	    if (facilityNo == null) {
	        return reservationRepository.findByUserNo_UserNo(userNo)
	        		.stream()
	                .map(ReservationListResponseDTO::from)
	                .collect(Collectors.toList());
	    }

	    // 임대인
	    return reservationRepository.findByFacilityNo_FacilityNo(facilityNo)
	    		.stream()
	            .map(ReservationListResponseDTO::from)
	            .collect(Collectors.toList());
	}

	// 예약 내용 수정
	@Override
	@Transactional
	public void modifyReservation(String reservationNo, ReservationModifyRequestDTO dto, String userNo) {
		// 예약 번호 찾기
		ReservationEntity entity = reservationRepository.findById(reservationNo)
				.orElseThrow(() -> new NotFoundException("no reservation data exists"));
		
		// 권한 확인하기
	    if (!entity.getUser().getUserNo().equals(userNo)) {
	        throw new ForbiddenException("no permission to modify this reservation"); 
	    }

		// dto 업데이트
		entity.updateReservation(dto);
	}
}
