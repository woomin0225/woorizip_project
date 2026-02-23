package org.team4p.woorizip.house.image.jpa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;

public interface HouseImageRepository extends JpaRepository<HouseImageEntity, Integer>, HouseImageRepositoryCustom {
	List<HouseImageEntity> findAllByHouseNo(String houseNo);
	int countByHouseNo(String houseNo);
}
