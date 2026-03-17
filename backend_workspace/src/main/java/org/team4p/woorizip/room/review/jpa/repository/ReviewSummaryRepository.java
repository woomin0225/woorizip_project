package org.team4p.woorizip.room.review.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.room.review.jpa.entity.ReviewSummaryEntity;

public interface ReviewSummaryRepository extends JpaRepository<ReviewSummaryEntity, String>{
	List<ReviewSummaryEntity> findAllBySummaryStatus(String status);
}
