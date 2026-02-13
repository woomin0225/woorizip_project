package org.team4p.woorizip.wishlist.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.wishlist.jpa.entity.WishlistEntity;

@Repository
public interface WishlistRepository extends JpaRepository<WishlistEntity, String>, WishlistRepositoryCustom { 

    // 단순 조회/삭제는 JPA Naming Strategy 사용
    
    // 중복 체크용
    boolean existsByUserNoAndRoomNo(String userNo, String roomNo);

    // 사용자별 전체 삭제
    void deleteByUserNo(String userNo);
    
    // 단건 삭제는 deleteById(String id)가 기본 제공되므로 생략
}