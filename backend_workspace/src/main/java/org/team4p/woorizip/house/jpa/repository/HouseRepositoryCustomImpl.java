package org.team4p.woorizip.house.jpa.repository;

import java.time.LocalDateTime;

import org.springframework.stereotype.Repository;
import org.team4p.woorizip.house.jpa.entity.QHouseEntity;

import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class HouseRepositoryCustomImpl implements HouseRepositoryCustom {
	
	private final JPAQueryFactory queryFactory;  //QueryDSL 의 핵심 객체임
    private final EntityManager entityManager;  //queryDSL 에서 JPQL/Native Query 사용을 위해 의존성 추가함
    private QHouseEntity qhouseEntity = QHouseEntity.houseEntity;
    
	@Override
	public long softDeleteByHouseNo(String houseNo) {
		// 건물 정보 소프트 삭제
		
		 long result = queryFactory.update(qhouseEntity)
						.set(qhouseEntity.deleted, true)
						.set(qhouseEntity.deletedAt, LocalDateTime.now())
						.where(qhouseEntity.houseNo.eq(houseNo))
						.execute();
		
		return result;
	}

}
