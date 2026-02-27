package org.team4p.woorizip.tour.jpa.repository;

import static org.team4p.woorizip.tour.jpa.entity.QTourEntity.tourEntity;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.tour.jpa.entity.TourEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
    public List<TourEntity> findByUserNo(String userNo) {
        return queryFactory
                .selectFrom(tourEntity)
                .where(tourEntity.userNo.eq(userNo))
                .fetch();
    }

    @Override
    public Page<TourEntity> findByUserNoOrderByVisitDateDesc(String userNo, Pageable pageable) {
        List<TourEntity> content = queryFactory
                .selectFrom(tourEntity)
                .where(tourEntity.userNo.eq(userNo))
                .orderBy(tourEntity.visitDate.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(tourEntity.count())
                .from(tourEntity)
                .where(tourEntity.userNo.eq(userNo))
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public boolean existsByRoomNoAndVisitDateAndVisitTimeAndStatusIn(
            String roomNo,
            LocalDate visitDate,
            String visitTime,
            Collection<String> statuses
    ) {
        Integer exists = queryFactory
                .selectOne()
                .from(tourEntity)
                .where(
                        tourEntity.roomNo.eq(roomNo),
                        tourEntity.visitDate.eq(visitDate),
                        tourEntity.visitTime.eq(visitTime),
                        tourEntity.status.in(statuses)
                )
                .fetchFirst();

        return exists != null;
    }

    @Override
    public boolean existsByRoomNoAndVisitDateAndVisitTimeAndStatusInAndTourNoNot(
            String roomNo,
            LocalDate visitDate,
            String visitTime,
            Collection<String> statuses,
            String tourNo
    ) {
        Integer exists = queryFactory
                .selectOne()
                .from(tourEntity)
                .where(
                        tourEntity.roomNo.eq(roomNo),
                        tourEntity.visitDate.eq(visitDate),
                        tourEntity.visitTime.eq(visitTime),
                        tourEntity.status.in(statuses),
                        tourEntity.tourNo.ne(tourNo)
                )
                .fetchFirst();

        return exists != null;
    }
}
