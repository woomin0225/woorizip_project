package org.team4p.woorizip.reservation.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.reservation.jpa.entity.ReservationEntity;

public interface ReservationRepository  extends JpaRepository<ReservationEntity, String> {

}
