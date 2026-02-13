package org.team4p.woorizip.wishlist.jpa.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.wishlist.jpa.entity.WishlistEntity;

import java.util.List;

// Q클래스 import (QueryDSL 설정에 따라 경로가 다를 수 있음)
import static org.team4p.woorizip.wishlist.jpa.entity.QWishlistEntity.wishlistEntity;

@RequiredArgsConstructor
public class WishlistRepositoryCustomImpl implements WishlistRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    /**
     * 내 찜 목록 개수 조회
     * 조건: userNo 일치
     */
    @Override
    public long countMyWishlist(String userNo) {
        Long count = queryFactory
                .select(wishlistEntity.count())
                .from(wishlistEntity)
                .where(wishlistEntity.userNo.eq(userNo))
                .fetchOne();

        return count != null ? count : 0L;
    }

    /**
     * 내 찜 목록 조회 (페이징 적용)
     * 조건: userNo 일치
     * 정렬: 최신순 (regDate 내림차순, 없다면 wishNo 내림차순 등 상황에 맞게 조정)
     */
    @Override
    public List<WishlistEntity> findMyWishlist(String userNo, Pageable pageable) {
        return queryFactory
                .selectFrom(wishlistEntity)
                .where(wishlistEntity.userNo.eq(userNo))
                .orderBy(wishlistEntity.createdAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }
}