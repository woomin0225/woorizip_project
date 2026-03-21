package org.team4p.woorizip.reservation.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.facility.jpa.repository.FacilityRepository;
import org.team4p.woorizip.reservation.enums.ReservationStatus;
import org.team4p.woorizip.reservation.jpa.repository.ReservationRepository;

import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FacilityStatusScheduler {

    private final FacilityRepository facilityRepository;
    private final ReservationRepository reservationRepository;

    @PostConstruct
    public void init() {
        autoUnlockFacilities(); 
    }
    
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoUnlockFacilities() {
    	LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        // 현재 시점 이전의 예약 방지용 예약 전부 삭제
        reservationRepository.deleteByReservationStatusAndReservationDateBefore(ReservationStatus.BLOCKED, today);
        reservationRepository.deleteByReservationStatusAndReservationDateAndReservationEndTimeBefore(
            ReservationStatus.BLOCKED, today, now
        );
        
        // 예약 방지용 예약이 없으면 상태 변경
        List<FacilityEntity> unavailableFacilities = facilityRepository.findByFacilityStatus(FacilityStatus.UNAVAILABLE);
        
        for (FacilityEntity facility : unavailableFacilities) {
            boolean hasBlock = reservationRepository.existsByFacility_FacilityNoAndReservationStatus(facility.getFacilityNo(), ReservationStatus.BLOCKED);
            if (!hasBlock) {
                facility.updateStatus(FacilityStatus.AVAILABLE);
            }
        }
    }
}
