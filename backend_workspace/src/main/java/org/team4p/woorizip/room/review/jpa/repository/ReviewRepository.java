package org.team4p.woorizip.room.review.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.team4p.woorizip.room.review.dto.ReviewRankingResponse;
import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Integer>, ReviewRepositoryCustom {
	Page<ReviewEntity> findByRoomNo(String RoomNo, Pageable pageable);
	@Query("select r.userNo from ReviewEntity r where r.reviewNo = :reviewNo")
	String findUserNoByReviewNo(@Param("reviewNo") int reviewNo);

	@Query("""
			SELECT rr.room_no, AVG(rr.rating) AS avgRating
			FROM tb_reviews AS rr
			JOIN tb_rooms AS r ON rr.room_no = r.room_no
			JOIN tb_houses AS h ON r.house_no = h.house_no
			WHERE r.deleted = 0 AND rr.review_created_at >= :cutoff
			GROUP BY rr.room_no
			ORDER BY avgRating DESC
			""")
	List<ReviewRankingResponse> findTopNByRating(LocalDateTime cutoff, Pageable pageable);
}
