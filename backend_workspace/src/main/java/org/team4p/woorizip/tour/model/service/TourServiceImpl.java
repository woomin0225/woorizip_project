package org.team4p.woorizip.tour.model.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    private final TourRepository tourRepository;

    @Override
    public TourDto selectTour(Long tour_no) {
        // tour_no가 String(UUID)으로 저장되어 있으므로 변환하여 조회
        TourEntity entity = tourRepository.findById(String.valueOf(tour_no)).orElse(null);
        return entity != null ? TourDto.fromEntity(entity) : null;
    }

    @Override
    public List<TourDto> selectListTour(Long userNo) {
        // user_no 컬럼을 기준으로 목록 조회 (TourRepository에 해당 메서드 필요)
        List<TourEntity> list = tourRepository.findByUserNo(String.valueOf(userNo));
        return toList(list);
    }

    @Override
    @Transactional
    public int insertTour(TourDto tourDto) {
        try {
            TourEntity entity = tourDto.toEntity();
            return tourRepository.save(entity) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("투어 추가 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    @Transactional
    public int updateTour(TourDto tourDto) {
        try {
            // save는 PK가 있으면 수정을 수행함
            return tourRepository.save(tourDto.toEntity()) != null ? 1 : 0;
        } catch (Exception e) {
            log.error("투어 수정 중 오류 발생: {}", e.getMessage());
            return 0;
        }
    }

    // List 변환 로직 (UserServiceImpl 구조 참조)
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