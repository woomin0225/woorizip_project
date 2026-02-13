package org.team4p.woorizip.wishlist.jpa.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.wishlist.model.dto.WishlistDto;

public interface WishlistRepositoryCustom {
    
    // 내 찜 목록 개수 조회
    long countMyWishlist(String userNo);

    // 내 찜 목록 조회 (페이징)
    List<WishlistDto> findMyWishlist(String userNo, Pageable pageable);
}