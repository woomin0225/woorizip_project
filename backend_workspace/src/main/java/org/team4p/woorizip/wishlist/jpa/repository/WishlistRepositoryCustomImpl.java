package org.team4p.woorizip.wishlist.jpa.repository;

import static org.team4p.woorizip.wishlist.jpa.entity.QWishlistEntity.wishlistEntity;
//import static org.team4p.woorizip.room.jpa.entity.QRoomEntity.roomEntity;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.team4p.woorizip.wishlist.model.dto.WishlistDto;

import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class WishlistRepositoryCustomImpl implements WishlistRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public long countMyWishlist(String userNo) {
        Long count = queryFactory
                .select(wishlistEntity.count())
                .from(wishlistEntity)
                .where(wishlistEntity.userNo.eq(userNo))
                .fetchOne();

        return count != null ? count : 0L;
    }

    @Override
    public List<WishlistDto> findMyWishlist(String userNo, Pageable pageable) {
        return queryFactory
                .select(Projections.fields(WishlistDto.class,
                        wishlistEntity.wishNo,
                        wishlistEntity.userNo,
                        wishlistEntity.roomNo,
                        wishlistEntity.createdAt
//                        ,
//                        roomEntity.roomName.as("targetTitle") // roomName을 targetTitle로 매핑
                ))
                .from(wishlistEntity)
//                .leftJoin(roomEntity).on(wishlistEntity.roomNo.eq(roomEntity.roomNo))
                .where(wishlistEntity.userNo.eq(userNo))
                .orderBy(wishlistEntity.createdAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }
}