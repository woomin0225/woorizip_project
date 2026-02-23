package org.team4p.woorizip.tour.jpa.repository;

import java.util.List;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;

public interface TourRepositoryCustom {
    List<TourEntity> findByUserNo(String user_no);
}