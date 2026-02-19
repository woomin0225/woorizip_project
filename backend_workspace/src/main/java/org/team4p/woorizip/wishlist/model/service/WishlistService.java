package org.team4p.woorizip.wishlist.model.service;

import java.util.ArrayList;
import org.team4p.woorizip.wishlist.model.dto.WishlistDto;
import org.springframework.data.domain.Pageable;

public interface WishlistService {
    
    // 찜 추가 (중복 체크 포함)
    int insertWishlist(WishlistDto wishlistDto);
    
    // 찜 상세 조회 (단건)
    WishlistDto selectWishlist(String wishNo);
    
    // 찜 삭제 (단건)
    int deleteWishlist(String wishNo);
    
    // 내 찜 목록 전체 삭제
    int deleteMyWishlist(String userNo);
    
    // 내 찜 목록 개수 (페이징 계산용)
    int selectMyListCount(String userNo);
    
    // 내 찜 목록 조회 (페이징)
    ArrayList<WishlistDto> selectMyList(String userNo, Pageable pageable);
}