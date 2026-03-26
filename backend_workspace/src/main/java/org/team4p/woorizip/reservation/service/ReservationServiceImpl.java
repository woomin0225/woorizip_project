package org.team4p.woorizip.reservation.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.exception.ForbiddenException;
import org.team4p.woorizip.common.exception.NotFoundException;
import org.team4p.woorizip.common.validator.LesseeValidator;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.reservation.dto.ReservationCreateRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationDetailResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationListResponseDTO;
import org.team4p.woorizip.reservation.dto.ReservationModifyRequestDTO;
import org.team4p.woorizip.reservation.dto.ReservationStatsDTO;
import org.team4p.woorizip.reservation.enums.ReservationStatus;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;
import org.team4p.woorizip.reservation.jpa.repository.ReservationRepository;
import org.team4p.woorizip.user.jpa.entity.UserEntity;
import org.team4p.woorizip.user.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

	private static final int DEFAULT_RESERVATION_UNIT_MINUTES = 30;
	private static final int DEFAULT_MAX_DURATION_MINUTES = 120;
	private static final int DEFAULT_MAX_RESERVATIONS_PER_DAY = Integer.MAX_VALUE;

	private final FacilityRepository facilityRepository;
	private final ReservationRepository reservationRepository;
	private final UserRepository userRepository;
	private final LesseeValidator lesseeValidator;
	
	// 예약 신규 등록
	@Override
	@Transactional
	public void createReservation(ReservationCreateRequestDTO dto, String userNo, String facilityNo) {
		// 시설 조회
		FacilityEntity facility = facilityRepository.findById(facilityNo)
				.orElseThrow(() -> new NotFoundException("시설 정보를 찾을 수 없습니다."));

		// 유저 조회
		UserEntity user = userRepository.findById(userNo)
				.orElseThrow(() -> new NotFoundException("사용자 정보를 찾을 수 없습니다."));
		
		String houseNo = lesseeValidator.validLessee(userNo);
		
		// facility가 속한 house의 거주자인지 확인
		if (!houseNo.equals(facility.getHouse().getHouseNo())) {
			throw new ForbiddenException("해당 시설이 속한 건물의 입주자가 아닙니다.");
		}
		
		// 시설이 사용 가능한 상태인지 확인
		if(!facility.getFacilityStatus().equals(FacilityStatus.AVAILABLE)) {
			throw new ForbiddenException("시설이 이용 가능한 상태가 아닙니다.");
		}
		
		validateReservation(facility, userNo, dto.getReservationDate(), dto.getReservationStartTime(), dto.getReservationEndTime(), null, false);
	    
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

	// 예약 신규 시 기존 예약 확인용 메서드
	public List<ReservationListResponseDTO> selectList(String facilityNo, LocalDate date) {
	    return reservationRepository
	        .findByFacility_FacilityNoAndReservationDateAndReservationStatus(
	            facilityNo, date, ReservationStatus.APPROVED)
	        .stream()
	        .map(ReservationListResponseDTO::from)
	        .toList();
	}
	
	// 예약 목록 페이지 조회
	@Override
	public int selectListCount(String userNo, String facilityNo, String targetUserNo) {
    	// 임차인 (본인 예약)
        if (facilityNo == null || facilityNo.isEmpty()) {
        	String finalUserNo = resolveReservationOwnerUserNo(userNo, targetUserNo);
            return (int) reservationRepository.countByUser_UserNo(finalUserNo);
        }
        
        // 임대인/관리자 (특정 시설의 전체 예약)
        return (int) reservationRepository.countByFacility_FacilityNo(facilityNo);
    }

    // 예약 목록 조회
	@Override
	public List<ReservationListResponseDTO> selectList(Pageable pageable, String userNo, String facilityNo, String targetUserNo) {
    	// 임차인 (시설 번호가 없으면 본인 예약만 조회)
        if (facilityNo == null || facilityNo.isEmpty()) {
        	String finalUserNo = resolveReservationOwnerUserNo(userNo, targetUserNo);
        	
            return reservationRepository.findByUser_UserNo(finalUserNo, pageable)
                    .stream()
                    .map(ReservationListResponseDTO::from)
                    .collect(Collectors.toList());
        }

        // 임대인/관리자 (특정 시설의 전체 예약 조회)
        return reservationRepository.findByFacility_FacilityNo(facilityNo, pageable)
                .stream()
                .map(ReservationListResponseDTO::from)
                .collect(Collectors.toList());
    }

    // 예약 상세 조회
    @Override
    public ReservationDetailResponseDTO selectReservation(String reservationNo) {
        return reservationRepository.findById(reservationNo)
                .map(ReservationDetailResponseDTO::from)
                .orElseThrow(() -> new NotFoundException("예약 정보를 찾을 수 없습니다."));
    }

	// 예약 내용 수정
	@Override
	@Transactional
	public void modifyReservation(String reservationNo, ReservationModifyRequestDTO dto, String userNo) {
		// 예약 조회
		ReservationEntity entity = reservationRepository.findById(reservationNo)
				.orElseThrow(() -> new NotFoundException("예약 정보를 찾을 수 없습니다."));
		
		FacilityEntity facility = entity.getFacility();
		
		// 권한 확인
		UserEntity user = userRepository.findById(userNo)
				.orElseThrow(() -> new NotFoundException("사용자 정보를 찾을 수 없습니다."));
		
		boolean isAdmin = user.getRole().equals("ADMIN");
		
		if (!isAdmin && !entity.getUser().getUserNo().equals(userNo)) {
		    throw new ForbiddenException("예약 정보 수정 권한이 없습니다."); 
		}
	    
	    // 과거의 예약을 수정하는 것은 아닌지 확인
	    if (entity.getReservationDate().isBefore(LocalDate.now())) {
	        throw new ForbiddenException("이전 날짜의 예약은 수정할 수 없습니다.");
	    }
	    
	    LocalDateTime originalStart = LocalDateTime.of(entity.getReservationDate(), entity.getReservationStartTime());

	    // 이미 시작된 예약을 수정하려는 것은 아닌지 확인
	    if (originalStart.isBefore(LocalDateTime.now())) {
	        throw new ForbiddenException("이미 시작된 예약은 수정할 수 없습니다.");
	    }
	    
	    // 취소한 예약을 수정하려는 것은 아닌지 확인
	    if(entity.getReservationCanceledAt() != null) {
	    	throw new ForbiddenException("이미 취소한 예약은 수정할 수 없습니다.");
	    }
	    
	    validateReservation(facility, userNo, dto.getReservationDate(), dto.getReservationStartTime(), dto.getReservationEndTime(), reservationNo, isAdmin);
	    
		// dto 업데이트
		entity.updateReservation(dto);
	}

	private String resolveReservationOwnerUserNo(String userNo, String targetUserNo) {
		if (targetUserNo == null || targetUserNo.isBlank()) {
			return userNo;
		}

		UserEntity currentUser = userRepository.findById(userNo)
				.orElseThrow(() -> new NotFoundException("사용자 정보를 찾을 수 없습니다."));

		boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
		return isAdmin ? targetUserNo : userNo;
	}

	// FacilityStatus.UNAVAILABLE 처리
	public void createBlockReservation(String facilityNo, LocalDateTime blockedStartTime, LocalDateTime blockedEndTime, String userNo) {
		// 시설 조회
	    FacilityEntity facility = facilityRepository.findById(facilityNo)
	            .orElseThrow(() -> new NotFoundException("시설 정보를 찾을 수 없습니다."));
	    
	    // 유저 조회
	    UserEntity user = userRepository.findById(userNo)
	            .orElseThrow(() -> new NotFoundException("사용자 정보를 찾을 수 없습니다."));

	    LocalDate startDate = blockedStartTime.toLocalDate();
	    LocalDate endDate = blockedEndTime.toLocalDate();

	    // 시작일부터 종료일까지 날짜별 예약 생성
	    for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
	        
	        // 날짜별 시작/종료 시간 설정
	        LocalTime startTime = (date.equals(startDate)) ? blockedStartTime.toLocalTime() : LocalTime.of(0, 0);
	        LocalTime endTime = (date.equals(endDate)) ? blockedEndTime.toLocalTime() : LocalTime.of(23, 59);

	        ReservationEntity blockRsvn = ReservationEntity
	        		.builder()
	                .reservationNo(UUID.randomUUID().toString())
	                .facility(facility)
	                .user(user)
	                .reservationName("시설 사용 불가")
	                .reservationPhone(user.getPhone())
	                .reservationDate(date)
	                .reservationStartTime(startTime)
	                .reservationEndTime(endTime)
	                .reservationStatus(ReservationStatus.BLOCKED)
	                .build();
	        reservationRepository.save(blockRsvn);
	    }
	}
	
	// 공통 검증 메서드 추출
	private void validateReservation(FacilityEntity facility, String userNo, LocalDate date, 
	                                 LocalTime start, LocalTime end, String excludeRsvnNo, boolean isAdmin) {
	    
	    LocalDateTime startDateTime = LocalDateTime.of(date, start);
	    LocalTime openTime = facility.getFacilityOpenTime();
	    LocalTime closeTime = facility.getFacilityCloseTime();
	    int unit = resolveReservationUnitMinutes(facility);
	    int maxDurationMinutes = resolveMaxDurationMinutes(facility, unit);
	    int maxReservationsPerDay = resolveMaxReservationsPerDay(facility);

	    // 과거 시간 예약 불가
	    if (startDateTime.isBefore(LocalDateTime.now())) {
	        throw new ForbiddenException("현재 시각 이전 시간대로는 예약할 수 없습니다.");
	    }

	    // 시설 운영 시간 확인
	    if (openTime == null || closeTime == null) {
	        throw new IllegalArgumentException("시설 운영 시간이 설정되지 않았습니다.");
	    }
	    if (start.isBefore(openTime) || end.isAfter(closeTime)) {
	        throw new ForbiddenException("시설 운영 시간 내의 예약이 아닙니다.");
	    }

	    // 종료 시간이 시작 시간보다 빠른지 확인
	    if (!end.isAfter(start)) {
	        throw new NotFoundException("예약 시작 시간이 예약 종료 시간보다 빨라야 합니다.");
	    }
	    
	    // 운영 종료 시간이 23:59일 때
	    boolean isLastTimeFull = end.equals(closeTime);

	    // 예약 단위/최대 시간 검증 수정
	    long duration;

	    if (isLastTimeFull && closeTime.toString().startsWith("23:59")) {
	        duration = java.time.Duration.between(start, end).toMinutes() + 1;
	    } else {
	        duration = java.time.Duration.between(start, end).toMinutes();
	    }
	    int finalDuration = (int) duration;

	    if (start.getMinute() % unit != 0 || finalDuration % unit != 0) {
	        throw new ForbiddenException("예약 시간은 " + unit + "분 단위로 지정되어야 합니다.");
	    }

	    if (finalDuration > maxDurationMinutes) {
	        throw new ForbiddenException("최대 예약 가능 시간을 초과하였습니다.");
	    }

	    // 일일 최대 예약 횟수
	    if (!isAdmin) {
	        long count;
	        if (excludeRsvnNo == null) {
	            count = reservationRepository.countByUser_UserNoAndFacility_FacilityNoAndReservationDateAndReservationStatus(userNo, facility.getFacilityNo(), date, ReservationStatus.APPROVED);
	        } else {
	            count = reservationRepository.countByUser_UserNoAndFacility_FacilityNoAndReservationDateAndReservationNoNotAndReservationStatus(userNo, facility.getFacilityNo(), date, excludeRsvnNo, ReservationStatus.APPROVED);
	        }
	        
	        if (count >= maxReservationsPerDay) {
	            throw new ForbiddenException("일일 예약 가능 횟수를 초과하였습니다.");
	        }
	    }

	    // 시설 중복 예약 확인
	    List<ReservationStatus> unavailableStatuses = List.of(ReservationStatus.APPROVED, ReservationStatus.BLOCKED);
	    boolean isOverlapped;
	    if (excludeRsvnNo == null) {
	        isOverlapped = reservationRepository.existsByFacility_FacilityNoAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationStatusIn(
	                facility.getFacilityNo(), date, end, start, unavailableStatuses);
	    } else {
	        isOverlapped = reservationRepository.existsByFacility_FacilityNoAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationNoNotAndReservationStatusIn(
	                facility.getFacilityNo(), date, end, start, excludeRsvnNo, unavailableStatuses);
	    }

	    if (isOverlapped) {
	        throw new ForbiddenException("해당 시간에는 다른 사용자의 예약이 존재합니다.");
	    }
	    
	    // 다른 시설 중복 예약 확인
	    boolean isUserBusy;
	    if (excludeRsvnNo == null) {
	        isUserBusy = reservationRepository.existsByUser_UserNoAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationStatus(
	                userNo, date, end, start, ReservationStatus.APPROVED);
	    } else {
	        isUserBusy = reservationRepository.existsByUser_UserNoAndReservationDateAndReservationStartTimeBeforeAndReservationEndTimeAfterAndReservationNoNotAndReservationStatus(
	                userNo, date, end, start, excludeRsvnNo, ReservationStatus.APPROVED);
	    }

	    if (isUserBusy) {
	        throw new ForbiddenException("해당 시간대에 다른 시설 예약 내역이 존재합니다.");
	    }
	}

	private int resolveReservationUnitMinutes(FacilityEntity facility) {
	    Integer value = facility.getFacilityRsvnUnitMinutes();
	    return (value != null && value > 0) ? value : DEFAULT_RESERVATION_UNIT_MINUTES;
	}

	private int resolveMaxDurationMinutes(FacilityEntity facility, int unitMinutes) {
	    Integer value = facility.getFacilityMaxDurationMinutes();
	    int fallback = Math.max(DEFAULT_MAX_DURATION_MINUTES, unitMinutes);
	    return (value != null && value > 0) ? value : fallback;
	}

	private int resolveMaxReservationsPerDay(FacilityEntity facility) {
	    Integer value = facility.getMaxRsvnPerDay();
	    return (value != null && value > 0) ? value : DEFAULT_MAX_RESERVATIONS_PER_DAY;
	}
	
	// 시설 사용 분석용 데이터 조회
    @Override
    public List<ReservationStatsDTO> analyzeReservation(String facilityNo) {
        return reservationRepository.findByFacility_FacilityNo(facilityNo)
        		.stream()
                .map(ReservationStatsDTO::from)
                .collect(Collectors.toList());
    }
}
