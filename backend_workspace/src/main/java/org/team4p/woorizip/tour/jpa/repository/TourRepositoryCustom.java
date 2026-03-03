package org.team4p.woorizip.tour.jpa.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;

public interface TourRepositoryCustom {
    List<TourEntity> findByUserNo(String userNo);
    Page<TourEntity> findByUserNoOrderByVisitDateDesc(String userNo, Pageable pageable);
    Page<TourEntity> findByRoomOwnerNoOrderByVisitDateDesc(String ownerUserNo, Pageable pageable);
    boolean existsByRoomNoAndVisitDateAndVisitTimeAndStatusIn(
            String roomNo,
            LocalDate visitDate,
            String visitTime,
            Collection<String> statuses
    );
    boolean existsByRoomNoAndVisitDateAndVisitTimeAndStatusInAndTourNoNot(
            String roomNo,
            LocalDate visitDate,
            String visitTime,
            Collection<String> statuses,
            String tourNo
    );
}
