package org.team4p.woorizip.house.jpa.repository;

import java.util.List;
import java.util.Map;

import org.team4p.woorizip.house.jpa.entity.HouseEntity;
import org.team4p.woorizip.room.dto.request.RoomSearchCondition;

public interface HouseRepositoryCustom {
	long softDeleteByHouseNo(String houseNo);
	List<HouseEntity> searchHouses(RoomSearchCondition cond);
	Map<String, Integer> searchPriceOfHouses(RoomSearchCondition cond);
}
