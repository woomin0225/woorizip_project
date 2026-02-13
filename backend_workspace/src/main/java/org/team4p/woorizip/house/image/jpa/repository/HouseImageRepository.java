package org.team4p.woorizip.house.image.jpa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.house.image.jpa.entity.HouseImageEntity;

public interface HouseImageRepository extends JpaRepository<HouseImageEntity, Integer>, HouseImageRepositoryCustom {

}
