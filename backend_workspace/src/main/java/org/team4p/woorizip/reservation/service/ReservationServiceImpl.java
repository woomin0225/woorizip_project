package org.team4p.woorizip.reservation.service;

import java.time.LocalDate;
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
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.jpa.repository.RoomRepository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

	private final FacilityRepository facilityRepository;
	private final ReservationRepository reservationRepository;
	private final UserRepository userRepository;
	private final RoomRepository roomRepository;

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
		
		// facility가 속한 house의 거주자인지 확인
		List<RoomEntity> rooms = roomRepository.findAllByHouseNo(facility.getHouse().getHouseNo());
		
		boolean isResident = false;
		for (RoomEntity room : rooms) {
		    if (room.getUserNo() != null && room.getUserNo().equals(userNo)) {
		        isResident = true;
		        break;
		    }
		}
		if (!isResident) {
		    throw new ForbiddenException("no permission to make reservation on this facility");
		}
		
		// 시설 운영 시간 내의 예약인지 확인
		if (dto.getReservationStartTime().isBefore(facility.getFacilityOpenTime()) || 
				dto.getReservationEndTime().isAfter(facility.getFacilityCloseTime())) {
			throw new ForbiddenException("no permission to make reservation on this time");
		}
		
		// 예약 종료 시간이 시작 시간보다 빠른지 확인
	    if (!dto.getReservationEndTime().isAfter(dto.getReservationStartTime())) {
	        throw new NotFoundException("EndTime cannot be earlier than StartTime");
	    }
	    
	    // 예약 단위 내의 예약인지 확인
	    if (dto.getReservationStartTime().getMinute() % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("reservation must follow the time unit: " + facility.getFacilityRsvnUnitMinutes());
	    }
	    
	    int duration = (int) java.time.Duration.between(dto.getReservationStartTime(), dto.getReservationEndTime()).toMinutes();
	    
	    // 최대 이용 시간 이내인지 확인
	    if (duration > facility.getFacilityMaxDurationMinutes()) {
	        throw new ForbiddenException("exceeds maximum duration");
	    }
	    
	    // 이용 시간이 단위 시간의 배수인지 확인
	    if (duration % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("Reservation duration must be in multiples of " 
	                                     + facility.getFacilityRsvnUnitMinutes() + " minutes.");
	    }
	    
	    // 일일 최대 예약 횟수 검증
	    long reservationCount = reservationRepository.countByUserAndFacilityAndReservationDate(
	            user, facility, dto.getReservationDate());
	    if (reservationCount >= facility.getMaxRsvnPerDay()) {
	        throw new ForbiddenException("Exceeds maximum reservations per day (" + facility.getMaxRsvnPerDay() + " times).");
	    }
		
	    // 중복 예약인지 확인
	    boolean isOverlapped = reservationRepository.existsByFacilityAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfter(
	            facility, dto.getReservationDate(), dto.getReservationEndTime(), dto.getReservationStartTime());
	    if (isOverlapped) {
	        throw new ForbiddenException("Other reservation already exists");
	    }
	    
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
	        return reservationRepository.findByUser_UserNo(userNo)
	        		.stream()
	                .map(ReservationListResponseDTO::from)
	                .collect(Collectors.toList());
	    }

	    // 임대인
	    return reservationRepository.findByFacility_FacilityNo(facilityNo)
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
		
		FacilityEntity facility = entity.getFacility();
		
		// 본인 확인
	    if (!entity.getUser().getUserNo().equals(userNo)) {
	        throw new ForbiddenException("no permission to modify this reservation"); 
	    }
	    
	    // 과거의 예약을 수정하는 것은 아닌지 확인
	    if (dto.getReservationDate().isBefore(LocalDate.now())) {
	        throw new ForbiddenException("cannot modify reservation to a past date");
	    }
	    
	    // 시설 운영 시간 내의 예약인지 확인
	    if (dto.getReservationStartTime().isBefore(facility.getFacilityOpenTime()) || 
	    		dto.getReservationEndTime().isAfter(facility.getFacilityCloseTime())) {
	    	throw new ForbiddenException("no permission to make reservation on this time");
	    }

	    // 예약 종료 시간이 시작 시간보다 빠른지 확인
	    if (!dto.getReservationEndTime().isAfter(dto.getReservationStartTime())) {
	        throw new NotFoundException("EndTime cannot be earlier than StartTime");
	    }
	    
	    // 예약 단위 내의 예약인지 확인
	    if (dto.getReservationStartTime().getMinute() % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("reservation must follow the time unit: " + facility.getFacilityRsvnUnitMinutes());
	    }
	    
	    int duration = (int) java.time.Duration.between(dto.getReservationStartTime(), dto.getReservationEndTime()).toMinutes();
	    
	    // 최대 이용 시간 이내인지 확인
	    if (duration > facility.getFacilityMaxDurationMinutes()) {
	        throw new ForbiddenException("exceeds maximum duration");
	    }
	    
	    // 이용 시간이 단위 시간의 배수인지 확인
	    if (duration % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("Reservation duration must be in multiples of " 
	                                     + facility.getFacilityRsvnUnitMinutes() + " minutes.");
	    }
	    
	    // 일일 최대 예약 횟수 검증
	    long reservationCount = reservationRepository.countByUserAndFacilityAndReservationDateAndReservationNoNot(
	    		entity.getUser(), facility, dto.getReservationDate(), reservationNo);
	    if (reservationCount >= facility.getMaxRsvnPerDay()) {
	        throw new ForbiddenException("Exceeds maximum reservations per day (" + facility.getMaxRsvnPerDay() + " times).");
	    }
	    
	    // 중복 예약인지 확인
	    boolean isOverlapped = reservationRepository.existsByFacilityAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationNoNot(
	            facility, 
	            dto.getReservationDate(), 
	            dto.getReservationEndTime(), 
	            dto.getReservationStartTime(),
	            reservationNo
	    );
	    
	    if (isOverlapped) {
	        throw new ForbiddenException("Other reservation already exists");
	    }
	    
		// dto 업데이트
		entity.updateReservation(dto);
	}
}
