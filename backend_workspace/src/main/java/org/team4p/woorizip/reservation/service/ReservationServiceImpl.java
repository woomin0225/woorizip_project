package org.team4p.woorizip.reservation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
				.orElseThrow(() -> new NotFoundException("시설 정보를 찾을 수 없습니다."));

		// 유저 번호 가져오기
		UserEntity user = userRepository.findById(userNo)
				.orElseThrow(() -> new NotFoundException("유저 정보를 찾을 수 없습니다."));
		
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
		    throw new ForbiddenException("이 시설에 대한 예약 권한이 없습니다.");
		}
		
		// 예약하려는 날짜와 시간이 현재 시점 이후인지 확인
		LocalDateTime reservationStartDateTime = LocalDateTime.of(dto.getReservationDate(), dto.getReservationStartTime());

		if (reservationStartDateTime.isBefore(LocalDateTime.now())) {
		    throw new ForbiddenException("현재 시각 이전 시간대로는 예약할 수 없습니다.");
		}
		
		// 시설 운영 시간 내의 예약인지 확인
		if (dto.getReservationStartTime().isBefore(facility.getFacilityOpenTime()) || 
				dto.getReservationEndTime().isAfter(facility.getFacilityCloseTime())) {
			throw new ForbiddenException("시설 운영 시간 내의 예약이 아닙니다.");
		}
		
		// 예약 종료 시간이 시작 시간보다 빠른지 확인
	    if (!dto.getReservationEndTime().isAfter(dto.getReservationStartTime())) {
	        throw new NotFoundException("예약 시작 시간이 예약 종료 시간보다 빨라야 합니다.");
	    }
	    
	    // 예약 단위 내의 예약인지 확인
	    if (dto.getReservationStartTime().getMinute() % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("예약 시간은 " + facility.getFacilityRsvnUnitMinutes()+"분 단위로 지정되어야 합니다.");
	    }
	    
	    int duration = (int) java.time.Duration.between(dto.getReservationStartTime(), dto.getReservationEndTime()).toMinutes();
	    
	    // 최대 이용 시간 이내인지 확인
	    if (duration > facility.getFacilityMaxDurationMinutes()) {
	        throw new ForbiddenException("최대 예약 가능 시간을 초과하였습니다.");
	    }
	    
	    // 이용 시간이 단위 시간의 배수인지 확인
	    if (duration % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("이용 시간은 " 
	                                     + facility.getFacilityRsvnUnitMinutes() + "분 단위로 지정되어야 합니다.");
	    }
	    
	    // 일일 최대 예약 횟수 검증
	    long reservationCount = reservationRepository.countByUserAndFacilityAndReservationDate(
	            user, facility, dto.getReservationDate());
	    if (reservationCount >= facility.getMaxRsvnPerDay()) {
	        throw new ForbiddenException("일일 예약 가능 횟수인 "+ facility.getMaxRsvnPerDay() + "회를 초과하였습니다.");
	    }
		
	    // 중복 예약인지 확인
	    boolean isOverlapped = reservationRepository.existsByFacilityAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfter(
	            facility, dto.getReservationDate(), dto.getReservationEndTime(), dto.getReservationStartTime());
	    if (isOverlapped) {
	        throw new ForbiddenException("해당 시간에는 다른 예약이 존재합니다.");
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
				.orElseThrow(() -> new NotFoundException("예약 정보를 찾을 수 없습니다."));
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
				.orElseThrow(() -> new NotFoundException("예약 정보를 찾을 수 없습니다."));
		
		FacilityEntity facility = entity.getFacility();
		
		// 본인 확인
	    if (!entity.getUser().getUserNo().equals(userNo)) {
	        throw new ForbiddenException("예약 정보 수정 권한이 없습니다."); 
	    }
	    
	    // 과거의 예약을 수정하는 것은 아닌지 확인
	    if (entity.getReservationDate().isBefore(LocalDate.now())) {
	        throw new ForbiddenException("이전 날짜의 예약은 수정할 수 없습니다.");
	    }
	    
	    LocalDateTime reservationStartDateTime = LocalDateTime.of(dto.getReservationDate(), dto.getReservationStartTime());
	    
	    // 예약하려는 날짜와 시간이 현재 시점 이후인지 확인
	    if (reservationStartDateTime.isBefore(LocalDateTime.now())) {
	    	throw new ForbiddenException("현재 시각 이전 시간대로는 예약할 수 없습니다.");
	    }
	    
	    LocalDateTime originalStart = LocalDateTime.of(entity.getReservationDate(), entity.getReservationStartTime());

	    // 이미 시작된 예약을 수정하려는 것은 아닌지 확인
	    if (originalStart.isBefore(LocalDateTime.now())) {
	        throw new ForbiddenException("이미 시작된 예약은 수정할 수 없습니다.");
	    }
	    
	    // 시설 운영 시간 내의 예약인지 확인
	    if (dto.getReservationStartTime().isBefore(facility.getFacilityOpenTime()) || 
	    		dto.getReservationEndTime().isAfter(facility.getFacilityCloseTime())) {
	    	throw new ForbiddenException("시설 운영 시간 내의 예약이 아닙니다.");
	    }

	    // 예약 종료 시간이 시작 시간보다 빠른지 확인
	    if (!dto.getReservationEndTime().isAfter(dto.getReservationStartTime())) {
	        throw new NotFoundException("예약 시작 시간이 예약 종료 시간보다 빨라야 합니다.");
	    }
	    
	    // 예약 단위 내의 예약인지 확인
	    if (dto.getReservationStartTime().getMinute() % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("예약 시간은 " + facility.getFacilityRsvnUnitMinutes() + "분 단위로 지정되어야 합니다.");
	    }
	    
	    int duration = (int) java.time.Duration.between(dto.getReservationStartTime(), dto.getReservationEndTime()).toMinutes();
	    
	    // 최대 이용 시간 이내인지 확인
	    if (duration > facility.getFacilityMaxDurationMinutes()) {
	        throw new ForbiddenException("최대 예약 시간을 초과하였습니다.");
	    }
	    
	    // 이용 시간이 단위 시간의 배수인지 확인
	    if (duration % facility.getFacilityRsvnUnitMinutes() != 0) {
	        throw new ForbiddenException("이용 시간은 " 
	                                     + facility.getFacilityRsvnUnitMinutes() + "분 단위로 지정되어야 합니다.");
	    }
	    
	    // 일일 최대 예약 횟수 검증
	    long reservationCount = reservationRepository.countByUserAndFacilityAndReservationDateAndReservationNoNot(
	    		entity.getUser(), facility, dto.getReservationDate(), reservationNo);
	    if (reservationCount >= facility.getMaxRsvnPerDay()) {
	        throw new ForbiddenException("일일 예약 가능 횟수인 " + facility.getMaxRsvnPerDay() + "회를 초과하였습니다.");
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
	        throw new ForbiddenException("해당 시간에는 다른 예약이 존재합니다.");
	    }
	    
		// dto 업데이트
		entity.updateReservation(dto);
	}
}
