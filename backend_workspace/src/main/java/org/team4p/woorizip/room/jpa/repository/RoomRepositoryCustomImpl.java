package org.team4p.woorizip.room.jpa.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.house.jpa.entity.QHouseEntity;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.QRoomEntity;
import org.team4p.woorizip.room.jpa.entity.RoomEntity;
import org.team4p.woorizip.room.type.RoomType;
import org.team4p.woorizip.room.type.SearchCriterion;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class RoomRepositoryCustomImpl implements RoomRepositoryCustom {

	private final JPAQueryFactory queryFactory;  //QueryDSL 의 핵심 객체임
    private final EntityManager entityManager;  //queryDSL 에서 JPQL/Native Query 사용을 위해 의존성 추가함
    private QRoomEntity qroomEntity = QRoomEntity.roomEntity;
    private QHouseEntity qhouseEntity = QHouseEntity.houseEntity;
//    private QWishlistEntity qwishlistEntity = QWishlistEntity qwisilistEntity;
    
	@Override
	public void softDeleteByHouseNo(String houseNo) {
		// 건물소속 방 정보 소프트 삭제

		queryFactory.update(qroomEntity)
				.set(qroomEntity.deleted, true)
				.set(qroomEntity.deletedAt, LocalDateTime.now())
				.where(qroomEntity.houseNo.eq(houseNo))
				.execute();
	}

	@Override
	public Page<RoomEntity> search(RoomSearchCondition cond, Pageable pageable, SearchCriterion criterion) {
		// 방 검색
		
		// 조건 생성 시작
		BooleanBuilder where = new BooleanBuilder();
		
		// 키워드 단어를 방 또는 건물 이름이 포함하는지
		if(StringUtils.hasText(cond.getKeyword())) {
			where.and(qroomEntity.roomName.contains(cond.getKeyword())).or(qhouseEntity.houseName.contains(cond.getKeyword()));
		}
		
		// 전/월세 적용, 월세면 세액 범위 지정, 전세면 보증금 범위 지정
		if(cond.getRoomType() != null) {
			where.and(qroomEntity.roomMethod.eq(cond.getRoomType().toString()));
			
			switch(cond.getRoomType()) {
				case RoomType.M:	
					if(cond.getMinTax() != null) where.and(qroomEntity.roomMonthly.goe(cond.getMinTax()));
					if(cond.getMaxTax() != null) where.and(qroomEntity.roomMonthly.loe(cond.getMaxTax()));
				case RoomType.L:
					if(cond.getMinDeposit() != null) where.and(qroomEntity.roomDeposit.goe(cond.getMinDeposit()));
					if(cond.getMaxDeposit() != null) where.and(qroomEntity.roomDeposit.loe(cond.getMaxDeposit()));
			}
		}
		
		// 방 옵션들 조건
		Set<String> options = cond.getOptions();
		if(cond.getOptions() != null && cond.getOptions().size() >= 0) {
			for(String option : options) {
				option = option.trim();
				if(StringUtils.hasText(option)) where.and(qroomEntity.roomOptions.contains(option));
			}
		}
		
		// 방 수용인원 조건
		if(cond.getRoomRoomCount() != null && cond.getRoomRoomCount() > 0) {
			where.and(qroomEntity.roomRoomCount.goe(cond.getRoomRoomCount()));
		}
		
		// 방 노출 상태 ACTIVE만 검색 결과 출력
		where.and(qroomEntity.roomStatus.eq("ACTIVE"));
		
		// bbox 좌표 크기순서 보증
		cond.adjustment();
		// 위도 범위 조건
		if(cond.getSwLat() != null && cond.getNeLat() != null) {
			where.and(qhouseEntity.houseLat.between(cond.getSwLat(), cond.getNeLat()));
		}else {
			throw new RuntimeException();
		}
		// 경도 범위 조건
		if(cond.getSwLng() != null && cond.getNeLng() != null) {
			where.and(qhouseEntity.houseLng.between(cond.getSwLng(), cond.getNeLng()));
		}
		
		// 승강기 유무 조건
		if(cond.getHouseElevatorYn() != null && cond.getHouseElevatorYn() == true) {
			where.and(qhouseEntity.houseElevatorYn.isTrue());
		}
		
		// 애완동물 가능 여부
		if(cond.getHousePetYn() != null && cond.getHousePetYn() == true) {
			where.and(qhouseEntity.housePetYn.isTrue());
		}
		// 여성전용 여부
		if(cond.getHouseFemaleLimit() != null && cond.getHouseFemaleLimit() == true) {
			where.and(qhouseEntity.houseFemaleLimit.isTrue());
		}
		
		// 주차가능 여부
		if(cond.getHouseParking() != null && cond.getHouseParking() == true) {
			where.and(qhouseEntity.houseParkingMax.gt(0));
		}
		
		// 정렬 기준 추출
		OrderSpecifier<?> order = getOrder(criterion, qroomEntity); 
		
		List<RoomEntity> entityPage = queryFactory
										.selectFrom(qroomEntity)
										.join(qhouseEntity).on(qroomEntity.houseNo.eq(qhouseEntity.houseNo))
										.where(where)
										.offset(pageable.getOffset()) // 몇 번째 페이지부터 시작할 것 인지.
						                .limit(pageable.getPageSize()) // 페이지당 몇개의 데이터를 보여줄껀지
										.orderBy(order)
										.fetch();
		// 최대 갯수 계산
		Long totalCount = queryFactory
							.select(qroomEntity.count())
							.from(qroomEntity)
							.join(qhouseEntity).on(qroomEntity.houseNo.eq(qhouseEntity.houseNo))
							.where(where)
							.fetchOne();
		
		return new PageImpl<>(entityPage, pageable, totalCount);
	}
	
	private OrderSpecifier<?> getOrder(SearchCriterion criterion, QRoomEntity qroomEntity){
		switch (criterion) {
		case LATEST: return qroomEntity.roomUpdatedAt.desc();
		case AREA: return qroomEntity.roomArea.desc();
		default : return qroomEntity.roomUpdatedAt.desc();
		}
		// MOST_LIKED 추가 예정(QWishlistEntity 필요)
	}
}
