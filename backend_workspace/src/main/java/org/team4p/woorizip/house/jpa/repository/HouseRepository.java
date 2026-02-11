package org.team4p.woorizip.house.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;

@Repository
public interface HouseRepository extends JpaRepository<HouseEntity, String>, HouseRepositoryCustom {
	
}
