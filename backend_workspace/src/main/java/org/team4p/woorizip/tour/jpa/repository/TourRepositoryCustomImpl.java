package org.team4p.woorizip.tour.jpa.repository;

import static org.team4p.woorizip.tour.jpa.entity.QTourEntity.tourEntity;

import java.util.List;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class TourRepositoryCustomImpl implements TourRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    /**
     * user_no로 투어 목록 조회
     */
    @Override
    public List<TourEntity> findByUserNo(String user_no) {
        return queryFactory
                .selectFrom(tourEntity)
                .where(tourEntity.userNo.eq(user_no))
                .fetch();
    }
}