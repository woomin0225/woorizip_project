package org.team4p.woorizip.tour.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;

import java.util.Collection;
import java.util.Date;

public interface TourRepository 
        extends JpaRepository<TourEntity, String>, TourRepositoryCustom {
    Page<TourEntity> findByUserNoOrderByVisitDateDesc(String userNo, Pageable pageable);
    boolean existsByRoomNoAndVisitDateAndVisitTimeAndStatusIn(
            String roomNo,
            Date visitDate,
            String visitTime,
            Collection<String> statuses
    );
}
