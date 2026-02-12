package org.team4p.woorizip.wishlist.model.service;

import java.util.ArrayList;
import java.util.List;

import org.team4p.woorizip.wishlist.jpa.entity.WishlistEntity;
import org.team4p.woorizip.wishlist.jpa.repository.WishlistRepository;
import org.team4p.woorizip.wishlist.model.dto.WishlistDto;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;

    /**
     * 찜 추가 (중복 체크 포함)
     */
    @Override
    @Transactional
    public int insertWishlist(WishlistDto dto) {
        // 1. 중복 체크: 이미 찜한 매물인지 확인
        if (wishlistRepository.existsByUserNoAndRoomNo(dto.getUserNo(), dto.getRoomNo())) {
            return 0; // 이미 존재하므로 실패(0) 반환
        }
        // 2. 저장
        return wishlistRepository.save(dto.toEntity()) != null ? 1 : 0;
    }

    /**
     * 찜 상세 조회
     */
    @Override
    public WishlistDto selectWishlist(String wishNo) {
        // findById는 Optional을 반환하므로 없으면 null 반환
        return WishlistDto.fromEntity(
            wishlistRepository.findById(wishNo).orElse(null)
        );
    }

    /**
     * 찜 삭제 (단건)
     */
    @Override
    @Transactional
    public int deleteWishlist(String wishNo) {
        try {
            wishlistRepository.deleteById(wishNo);
            return 1;
        } catch (Exception e) {
            log.error("찜 삭제 실패 : {}", e.getMessage());
            return 0;
        }
    }

    /**
     * 내 찜 목록 전체 삭제
     */
    @Override
    @Transactional
    public int deleteMyWishlist(String userNo) {
        try {
            // Repository 인터페이스에 선언한 deleteByUserNo 사용
            wishlistRepository.deleteByUserNo(userNo);
            return 1;
        } catch (Exception e) {
            log.error("전체 삭제 실패 : {}", e.getMessage());
            return 0;
        }
    }

    /**
     * 내 찜 목록 개수 조회 (페이징 계산용)
     */
    @Override
    public int selectMyListCount(String userNo) {
        return (int) wishlistRepository.countMyWishlist(userNo);
    }

    /**
     * 내 찜 목록 조회 (페이징)
     */
    @Override
    public ArrayList<WishlistDto> selectMyList(String userNo, Pageable pageable) {
        return toList(wishlistRepository.findMyWishlist(userNo, pageable));
    }

    private ArrayList<WishlistDto> toList(List<WishlistEntity> list) {
        ArrayList<WishlistDto> dtoList = new ArrayList<>();
        if (list != null) {
            for (WishlistEntity entity : list) {
                dtoList.add(WishlistDto.fromEntity(entity));
            }
        }
        return dtoList;
    }
} // 클래스 끝 닫는 괄호