package org.team4p.woorizip.wishlist.jpa.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.room.dto.response.WishRankingResponse;
import org.team4p.woorizip.wishlist.jpa.entity.WishlistEntity;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistEntity, String>, WishlistRepositoryCustom { 

    
    // 중복 체크용
    boolean existsByUserNoAndRoomNo(String userNo, String roomNo);

    // 사용자별 전체 삭제
    void deleteByUserNo(String userNo);
    
    
    //
    @Query(value="""
    		SELECT w.room_no, count(*) AS wishCount, r.room_name, h.house_name, sumViews
		FROM tb_wishlists AS w
		JOIN tb_rooms AS r ON w.room_no = r.room_no
		JOIN tb_houses AS h ON r.house_no = h.house_no
		JOIN (
				SELECT room_no, SUM(view_count) AS sumViews
				FROM tb_room_view_hourly
		        GROUP BY room_no
			) AS j ON w.room_no = j.room_no
		WHERE r.deleted = 0
		GROUP BY w.room_no, r.room_name
		ORDER BY wishCount DESC, j.sumViews DESC
    		""", nativeQuery=true)
    List<WishRankingResponse> findPopularSince(Pageable pageable);
}