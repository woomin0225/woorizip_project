package org.team4p.woorizip.tour.model.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.team4p.woorizip.common.api.PageResponse;
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

    private static final Set<String> ACTIVE_TOUR_STATUSES = Set.of("PENDING", "APPROVED");

    private final TourRepository tourRepository;

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
    @Transactional
    public int insertTour(TourDto tourDto) {
        TourEntity entity = tourDto.toEntity();
        entity.setStatus("PENDING");

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
            log.warn("투어 슬롯 중복 신청 차단: roomNo={}, visitDate={}, visitTime={}",
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
            return tourRepository.save(tourDto.toEntity()) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("투어 수정 중 오류 발생: {}", e.getMessage());
            return 0;
        }
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
