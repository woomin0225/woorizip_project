package org.team4p.woorizip.house.jpa.repository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.house.jpa.entity.QHouseEntity;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;
import org.team4p.woorizip.room.jpa.entity.QRoomEntity;
import org.team4p.woorizip.room.type.RoomType;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQueryFactory;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class HouseRepositoryCustomImpl implements HouseRepositoryCustom {
	
	private final JPAQueryFactory queryFactory;  //QueryDSL 의 핵심 객체임
    private final EntityManager entityManager;  //queryDSL 에서 JPQL/Native Query 사용을 위해 의존성 추가함
    private final QHouseEntity qhouseEntity = QHouseEntity.houseEntity;
    private final QRoomEntity qroomEntity = QRoomEntity.roomEntity;
    
	@Override
	public long softDeleteByHouseNo(String houseNo) {
		// 건물 정보 소프트 삭제
		
		 long rows = queryFactory.update(qhouseEntity)
						.set(qhouseEntity.deleted, true)
						.set(qhouseEntity.deletedAt, LocalDateTime.now())
						.where(qhouseEntity.houseNo.eq(houseNo))
						.execute();
		
		return rows;
	}

	@Override
	public List<HouseEntity> searchHouses(RoomSearchCondition cond) {
		// 건물 마커 조회
		
		// 조건 생성 시작
		BooleanBuilder where = new BooleanBuilder();
		
		// 키워드 단어를 방 또는 건물 이름이 포함하는지
		if(StringUtils.hasText(cond.getKeyword())) {
			where.and(qroomEntity.roomName.contains(cond.getKeyword()).or(qhouseEntity.houseName.contains(cond.getKeyword())));
		}
		
		// 전/월세 적용, 월세면 세액 범위 지정, 전세면 보증금 범위 지정
		if(cond.getRoomType() != null) {
			where.and(qroomEntity.roomMethod.eq(cond.getRoomType().toString()));
			
			switch(cond.getRoomType()) {
				case RoomType.M:	
					if(cond.getMinTax() != null) where.and(qroomEntity.roomMonthly.goe(cond.getMinTax()));
					if(cond.getMaxTax() != null) where.and(qroomEntity.roomMonthly.loe(cond.getMaxTax()));
					break;
				case RoomType.L:
					if(cond.getMinDeposit() != null) where.and(qroomEntity.roomDeposit.goe(cond.getMinDeposit()));
					if(cond.getMaxDeposit() != null) where.and(qroomEntity.roomDeposit.loe(cond.getMaxDeposit()));
					break;
			}
		}
		
		// 방 옵션들 조건
		Set<String> options = cond.getOptions();
		if(cond.getOptions() != null && cond.getOptions().size() > 0) {
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
		
		// 위도 범위 조건
		if(cond.getSwLat() != null && cond.getNeLat() != null) {
			where.and(qhouseEntity.houseLat.between(cond.getSwLat(), cond.getNeLat()));
		}else {
			throw new IllegalArgumentException("잘못된 bbox 요청");
		}
		// 경도 범위 조건
		if(cond.getSwLng() != null && cond.getNeLng() != null) {
			where.and(qhouseEntity.houseLng.between(cond.getSwLng(), cond.getNeLng()));
		}else {
			throw new IllegalArgumentException("잘못된 bbox 요청");
		}
		
		// 승강기 유무 조건
		if(cond.getHouseElevatorYn() != null) {
			where.and(qhouseEntity.houseElevatorYn.eq(cond.getHouseElevatorYn()));
		}
		
		// 애완동물 가능 여부
		if(cond.getHousePetYn() != null) {
			where.and(qhouseEntity.housePetYn.eq(cond.getHousePetYn()));
		}
		// 여성전용 여부
		if(cond.getHouseFemaleLimit() != null) {
			where.and(qhouseEntity.houseFemaleLimit.eq(cond.getHouseFemaleLimit()));
		}
		
		// 주차가능 여부
		if(cond.getHouseParking() != null && cond.getHouseParking() == true) {
			where.and(qhouseEntity.houseParkingMax.gt(0));
		}
		
		where.and(qhouseEntity.deleted.isFalse());
		
		List<HouseEntity> rows = queryFactory.selectFrom(qhouseEntity)
									.join(qroomEntity).on(qroomEntity.houseNo.eq(qhouseEntity.houseNo))
									.where(where)
									.fetch();
		return rows;
	}

	@Override
	public Map<String, Long> searchPriceOfHouses(RoomSearchCondition cond) {
		// 건물 마커 조회시 최소 가격 조회
		
		// 조건 생성 시작
		BooleanBuilder where = new BooleanBuilder();
		
		// 키워드 단어를 방 또는 건물 이름이 포함하는지
		if(StringUtils.hasText(cond.getKeyword())) {
			where.and(qroomEntity.roomName.contains(cond.getKeyword()).or(qhouseEntity.houseName.contains(cond.getKeyword())));
		}
		
		// 전/월세 적용, 월세면 세액 범위 지정, 전세면 보증금 범위 지정
		if(cond.getRoomType() != null) {
			where.and(qroomEntity.roomMethod.eq(cond.getRoomType().toString()));
			
			switch(cond.getRoomType()) {
				case RoomType.M:	
					if(cond.getMinTax() != null) where.and(qroomEntity.roomMonthly.goe(cond.getMinTax()));
					if(cond.getMaxTax() != null) where.and(qroomEntity.roomMonthly.loe(cond.getMaxTax()));
					break;
				case RoomType.L:
					if(cond.getMinDeposit() != null) where.and(qroomEntity.roomDeposit.goe(cond.getMinDeposit()));
					if(cond.getMaxDeposit() != null) where.and(qroomEntity.roomDeposit.loe(cond.getMaxDeposit()));
					break;
			}
		}
		
		// 방 옵션들 조건
		Set<String> options = cond.getOptions();
		if(cond.getOptions() != null && cond.getOptions().size() > 0) {
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
		
		// 위도 범위 조건
		if(cond.getSwLat() != null && cond.getNeLat() != null) {
			where.and(qhouseEntity.houseLat.between(cond.getSwLat(), cond.getNeLat()));
		}else {
			throw new IllegalArgumentException("잘못된 bbox 요청");
		}
		// 경도 범위 조건
		if(cond.getSwLng() != null && cond.getNeLng() != null) {
			where.and(qhouseEntity.houseLng.between(cond.getSwLng(), cond.getNeLng()));
		}else {
			throw new IllegalArgumentException("잘못된 bbox 요청");
		}
		
		// 승강기 유무 조건
		if(cond.getHouseElevatorYn() != null) {
			where.and(qhouseEntity.houseElevatorYn.eq(cond.getHouseElevatorYn()));
		}
		
		// 애완동물 가능 여부
		if(cond.getHousePetYn() != null) {
			where.and(qhouseEntity.housePetYn.eq(cond.getHousePetYn()));
		}
		// 여성전용 여부
		if(cond.getHouseFemaleLimit() != null) {
			where.and(qhouseEntity.houseFemaleLimit.eq(cond.getHouseFemaleLimit()));
		}
		
		// 주차가능 여부
		if(cond.getHouseParking() != null && cond.getHouseParking() == true) {
			where.and(qhouseEntity.houseParkingMax.gt(0));
		}
		
		where.and(qhouseEntity.deleted.isFalse());
		
		Long min;
		Long max;
		Map<String, Long> map = new HashMap<>();
		if(cond.getRoomType() != null) {
			List<Tuple> deposit = queryFactory
					.select(qroomEntity.roomDeposit.min(), qroomEntity.roomDeposit.max())
					.from(qroomEntity)
					.join(qhouseEntity).on(qroomEntity.houseNo.eq(qhouseEntity.houseNo))
					.where(where)
					.fetch();
			min = deposit.get(0).get(qroomEntity.roomDeposit.min());
			max = deposit.get(0).get(qroomEntity.roomDeposit.max());
			map.put("minDeposit", min);
			map.put("maxDeposit", max);
			if(cond.getRoomType() == RoomType.M) {
				List<Tuple> monthly = queryFactory
						.select(qroomEntity.roomMonthly.min(), qroomEntity.roomMonthly.max())
						.from(qroomEntity)
						.join(qhouseEntity).on(qroomEntity.houseNo.eq(qhouseEntity.houseNo))
						.where(where)
						.fetch();
				min = monthly.get(0).get(qroomEntity.roomMonthly.min());
				max = monthly.get(0).get(qroomEntity.roomMonthly.max());
				map.put("minMonthly", min);
				map.put("maxMonthly", max);
			}
		}
		
		return map;
	}
}
