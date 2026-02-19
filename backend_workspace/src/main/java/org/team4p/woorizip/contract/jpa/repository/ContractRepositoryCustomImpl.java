package org.team4p.woorizip.contract.jpa.repository;

import static org.team4p.woorizip.contract.jpa.entity.QContractEntity.contractEntity;

import java.util.List;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.contract.jpa.entity.ContractEntity;
import com.querydsl.core.types.dsl.Wildcard;
import com.querydsl.jpa.impl.JPAQueryFactory;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class ContractRepositoryCustomImpl implements ContractRepositoryCustom {

    private final JPAQueryFactory queryFactory;

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
                .orderBy(contractEntity.moveInDate.desc()) // 최근 입주 예정일 순
                .fetch();
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