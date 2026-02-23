package org.team4p.woorizip.wishlist.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.wishlist.jpa.entity.WishlistEntity;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistEntity, String>, WishlistRepositoryCustom { 

    
    // 중복 체크용
    boolean existsByUserNoAndRoomNo(String userNo, String roomNo);

    // 사용자별 전체 삭제
    void deleteByUserNo(String userNo);
    
}