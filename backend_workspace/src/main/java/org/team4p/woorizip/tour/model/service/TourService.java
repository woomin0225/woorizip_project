package org.team4p.woorizip.tour.model.service;

import java.util.List;
import org.team4p.woorizip.tour.model.dto.TourDto;

public interface TourService {

    // 투어 조회
    TourDto selectTour(Long tour_no);

    // 투어 목록 조회
    List<TourDto> selectListTour(Long userNo);

    // 투어 추가
    int insertTour(TourDto tourDto);

    // 투어 수정
    int updateTour(TourDto tourDto);
}