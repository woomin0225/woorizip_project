package org.team4p.woorizip.room.review.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.team4p.woorizip.room.dto.response.ReviewRankingResponse;
import org.team4p.woorizip.room.review.jpa.entity.ReviewEntity;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Integer>, ReviewRepositoryCustom {
	Page<ReviewEntity> findByRoomNoOrderByReviewCreatedAtDesc(String RoomNo, Pageable pageable);
	@Query("select r.userNo from ReviewEntity r where r.reviewNo = :reviewNo")
	String findUserNoByReviewNo(@Param("reviewNo") int reviewNo);

	@Query(value="""
			SELECT rr.room_no, AVG(rr.rating) AS avgRating, r.room_name, h.house_name, sumViews
			FROM tb_reviews AS rr
			JOIN tb_rooms AS r ON rr.room_no = r.room_no
			JOIN tb_houses AS h ON r.house_no = h.house_no
			JOIN (
					SELECT room_no, SUM(view_count) AS sumViews
					FROM tb_room_view_hourly
			        GROUP BY room_no
				) AS j ON rr.room_no = j.room_no
			WHERE r.deleted = 0 AND rr.review_created_at >= :cutoff
			GROUP BY rr.room_no, r.room_name
			ORDER BY avgRating DESC, j.sumViews DESC
			""", nativeQuery=true)
	List<ReviewRankingResponse> findPopularSince(@Param("cutoff") LocalDateTime cutoff, Pageable pageable);
	
	@Query(value="""
			SELECT rr.review_content
			FROM tb_reviews AS rr
			WHERE rr.room_no = :roomNo
			ORDER BY rr.review_created_at DESC
			""", nativeQuery=true)
	List<String> findAllReviewContentsByRoomNoOrderByReviewCreatedAtDesc(@Param("roomNo") String roomNo);	// AI 서버로 요약 요청 보내기 위해 해당 방의 리뷰 전체 조회
}
