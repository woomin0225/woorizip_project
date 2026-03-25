package org.team4p.woorizip.tour.model.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.room.service.RoomAvailabilityPolicyService;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;
import org.team4p.woorizip.tour.jpa.repository.TourRepository;
import org.team4p.woorizip.tour.model.dto.TourDto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TourServiceImpl implements TourService {

    // 동일 시간대 예약 중복 체크 대상 상태
    private static final Set<String> ACTIVE_TOUR_STATUSES = Set.of("PENDING", "APPROVED");
    private static final String CONTRACT_APPROVED_CANCEL_REASON_TEMPLATE =
            "동일한 방에 %s부터 %d개월 계약이 승인되어 해당 기간의 투어 신청이 자동 취소되었습니다.";

    private final TourRepository tourRepository;
    private final RoomAvailabilityPolicyService roomAvailabilityPolicyService;

    @Override
    public TourDto selectTour(String tourNo) {
        TourEntity entity = tourRepository.findById(String.valueOf(tourNo)).orElse(null);
        return entity != null ? TourDto.fromEntity(entity) : null;
    }

    @Override
    public PageResponse<TourDto> selectListTour(String userNo, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Page<TourEntity> resultPage = tourRepository.findByUserNoOrderByVisitDateDesc(String.valueOf(userNo), pageable);

        List<TourDto> content = toList(resultPage.getContent());
        return new PageResponse<>(
                content,
                safePage,
                safeSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
    }

    @Override
    public PageResponse<TourDto> selectListTourByOwner(String ownerUserNo, int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        Page<TourEntity> resultPage = tourRepository.findByRoomOwnerNoOrderByVisitDateDesc(ownerUserNo, pageable);

        List<TourDto> content = toList(resultPage.getContent());
        return new PageResponse<>(
                content,
                safePage,
                safeSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
    }

    @Override
    @Transactional
    public int insertTour(TourDto tourDto) {
        TourEntity entity = tourDto.toEntity();
        entity.setStatus("PENDING");
        roomAvailabilityPolicyService.validateTourApplication(entity.getRoomNo());

        // 선조회로 중복 예약 차단
        boolean alreadyReserved = tourRepository.existsByRoomNoAndVisitDateAndVisitTimeAndStatusIn(
                entity.getRoomNo(),
                entity.getVisitDate(),
                entity.getVisitTime(),
                ACTIVE_TOUR_STATUSES
        );
        if (alreadyReserved) {
            return -1;
        }

        try {
            return tourRepository.save(entity) != null ? 1 : 0;
        } catch (DataIntegrityViolationException e) {
            log.warn("투어 신청 중복 요청 차단: roomNo={}, visitDate={}, visitTime={}",
                    entity.getRoomNo(), entity.getVisitDate(), entity.getVisitTime());
            return -1;
        } catch (Exception e) {
            log.error("투어 추가 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    @Transactional
    public int updateTour(TourDto tourDto) {
        try {
            TourEntity existing = tourRepository.findById(String.valueOf(tourDto.getTourNo())).orElse(null);
            if (existing == null) {
                return 0;
            }

            String targetRoomNo = tourDto.getRoomNo() != null ? tourDto.getRoomNo() : existing.getRoomNo();
            LocalDate targetVisitDate = tourDto.getVisitDate() != null ? tourDto.getVisitDate() : existing.getVisitDate();
            String targetVisitTime = tourDto.getVisitTime() != null ? tourDto.getVisitTime() : existing.getVisitTime();

            // 자기 자신 제외 후 충돌 여부 확인
            boolean alreadyReserved = tourRepository.existsByRoomNoAndVisitDateAndVisitTimeAndStatusInAndTourNoNot(
                    targetRoomNo,
                    targetVisitDate,
                    targetVisitTime,
                    ACTIVE_TOUR_STATUSES,
                    existing.getTourNo()
            );
            if (alreadyReserved) {
                return -1;
            }

            existing.setRoomNo(targetRoomNo);
            existing.setVisitDate(targetVisitDate);
            existing.setVisitTime(targetVisitTime);
            if (tourDto.getMessage() != null) {
                existing.setMessage(tourDto.getMessage());
            }
            if (tourDto.getStatus() != null) {
                existing.setStatus(tourDto.getStatus());
            }
            if (tourDto.getCanceledAt() != null) {
                existing.setCanceledAt(tourDto.getCanceledAt());
            }
            if (tourDto.getCanceledReason() != null) {
                existing.setCanceledReason(tourDto.getCanceledReason());
            }

            return tourRepository.save(existing) != null ? 1 : 0;
        } catch (DataIntegrityViolationException e) {
            log.warn("투어 수정 중복 요청 차단: tourNo={}", tourDto.getTourNo());
            return -1;
        } catch (Exception e) {
            log.error("투어 수정 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    @Transactional
    public int cancelToursForApprovedContract(String roomNo, LocalDate moveInDate, int termMonths) {
        if (roomNo == null || roomNo.isBlank() || moveInDate == null || termMonths <= 0) {
            return 0;
        }

        LocalDate moveOutDateExclusive = moveInDate.plusMonths(termMonths);
        LocalDate lastOccupiedDate = moveOutDateExclusive.minusDays(1);
        if (lastOccupiedDate.isBefore(moveInDate)) {
            lastOccupiedDate = moveInDate;
        }

        List<TourEntity> tours = tourRepository.findByRoomNoAndVisitDateBetweenAndStatusIn(
                roomNo,
                moveInDate,
                lastOccupiedDate,
                ACTIVE_TOUR_STATUSES
        );
        if (tours.isEmpty()) {
            return 0;
        }

        String cancelReason = CONTRACT_APPROVED_CANCEL_REASON_TEMPLATE.formatted(moveInDate, termMonths);
        Date canceledAt = new Date();
        for (TourEntity tour : tours) {
            tour.setStatus("CANCELED");
            tour.setCanceledAt(canceledAt);
            tour.setCanceledReason(cancelReason);
        }

        log.info(
                "계약 승인에 따른 투어 자동 취소: roomNo={}, moveInDate={}, termMonths={}, canceledCount={}",
                roomNo,
                moveInDate,
                termMonths,
                tours.size()
        );
        return tours.size();
    }

    private List<TourDto> toList(List<TourEntity> list) {
        List<TourDto> dtos = new ArrayList<>();
        if (list != null) {
            for (TourEntity entity : list) {
                dtos.add(TourDto.fromEntity(entity));
            }
        }
        return dtos;
    }
}
