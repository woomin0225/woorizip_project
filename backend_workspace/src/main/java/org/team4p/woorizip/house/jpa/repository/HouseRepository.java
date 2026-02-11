package org.team4p.woorizip.house.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;

public interface HouseRepository extends JpaRepository<HouseEntity, String>, HouseRepositoryCustom{

}
