package org.team4p.woorizip.room.jpa.repository;

import java.time.LocalDateTime;

import org.springframework.stereotype.Repository;
import org.team4p.woorizip.room.jpa.entity.QRoomEntity;

import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class RoomRepositoryCustomImpl implements RoomRepositoryCustom {

	private final JPAQueryFactory queryFactory;  //QueryDSL 의 핵심 객체임
    private final EntityManager entityManager;  //queryDSL 에서 JPQL/Native Query 사용을 위해 의존성 추가함
    private QRoomEntity qroomEntity = QRoomEntity.roomEntity;
    
	@Override
	public void softDeleteByHouseNo(String houseNo) {
		// 건물소속 방 정보 소프트 삭제

		queryFactory.update(qroomEntity)
				.set(qroomEntity.deleted, true)
				.set(qroomEntity.deletedAt, LocalDateTime.now())
				.where(qroomEntity.houseNo.eq(houseNo))
				.execute();
	}

}
