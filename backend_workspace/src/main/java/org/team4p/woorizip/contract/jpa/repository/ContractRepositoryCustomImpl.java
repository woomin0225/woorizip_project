package org.team4p.woorizip.contract.jpa.repository;

import static org.team4p.woorizip.contract.jpa.entity.QContractEntity.contractEntity;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import org.team4p.woorizip.contract.jpa.entity.QContractEntity;
import org.team4p.woorizip.user.jpa.entity.QUserEntity;
import org.team4p.woorizip.room.jpa.entity.QRoomEntity;

import com.querydsl.core.types.dsl.Wildcard;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ContractRepositoryCustomImpl implements ContractRepositoryCustom {

    private final JPAQueryFactory queryFactory;
    private final QContractEntity contract = QContractEntity.contractEntity;
    private final QRoomEntity room = QRoomEntity.roomEntity;
    private final QUserEntity user = QUserEntity.userEntity;

    /**
     * 계약 상세 정보 조회
     */
    @Override
    public ContractEntity findByContractNo(String contractNo) {
        return queryFactory
                .selectFrom(contractEntity)
                .where(contractEntity.contractNo.eq(contractNo))
                .fetchOne();
    }

    /**
     * 특정 사용자의 계약 목록 조회
     */
    @Override
    public List<ContractEntity> findByUserNo(String userNo) {
        return queryFactory
                .selectFrom(contractEntity)
                .where(contractEntity.userNo.eq(userNo))
                .orderBy(contractEntity.moveInDate.desc())
                .fetch();
    }

    @Override
    public Page<ContractEntity> findByRoomOwnerNoOrderByMoveInDateDesc(String ownerUserNo, Pageable pageable) {
        List<ContractEntity> content = queryFactory
                .selectFrom(contractEntity)
                .join(room).on(room.roomNo.eq(contractEntity.roomNo))
                .where(room.userNo.eq(ownerUserNo))
                .orderBy(contractEntity.moveInDate.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(Wildcard.count)
                .from(contractEntity)
                .join(room).on(room.roomNo.eq(contractEntity.roomNo))
                .where(room.userNo.eq(ownerUserNo))
                .fetchOne();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    /**
     * 특정 방에 대한 계약/신청 건수 조회
     */
    @Override
    public long countByRoomNo(String roomNo) {
        return queryFactory
                .select(Wildcard.count)
                .from(contractEntity)
                .where(contractEntity.roomNo.eq(roomNo))
                .fetchOne();
    }
}
