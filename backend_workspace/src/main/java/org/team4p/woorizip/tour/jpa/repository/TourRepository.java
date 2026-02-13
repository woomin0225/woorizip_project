package org.team4p.woorizip.tour.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;

public interface TourRepository 
        extends JpaRepository<TourEntity, String>, TourRepositoryCustom {
}