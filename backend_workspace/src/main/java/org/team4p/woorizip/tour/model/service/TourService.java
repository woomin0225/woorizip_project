package org.team4p.woorizip.tour.model.service;

import org.team4p.woorizip.common.api.PageResponse;
import org.team4p.woorizip.tour.model.dto.TourDto;

public interface TourService {

    // 투어 조회
    TourDto selectTour(String tourNo);

    // 투어 목록 조회
    PageResponse<TourDto> selectListTour(String userNo, int page, int size);

    // 투어 추가
    int insertTour(TourDto tourDto);

    // 투어 수정
    int updateTour(TourDto tourDto);
}
