package org.team4p.woorizip.room.review.jpa.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Integer>, ReviewRepositoryCustom {
	Page<ReviewEntity> findByRoomNo(String RoomNo, Pageable pageable);
}
