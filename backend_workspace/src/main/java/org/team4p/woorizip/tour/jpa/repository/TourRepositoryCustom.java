package org.team4p.woorizip.tour.jpa.repository;

import java.util.List;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;

public interface TourRepositoryCustom {
    // 유저 번호로 투어 목록 조회
    List<TourEntity> findByUserNo(String user_no);
}