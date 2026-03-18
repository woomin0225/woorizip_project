package org.team4p.woorizip.house.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;

@Repository
public interface HouseRepository extends JpaRepository<HouseEntity, String>, HouseRepositoryCustom {
	@Query("select h.userNo from HouseEntity h where h.houseNo = :houseNo")
	String findUserNoByHouseNo(@Param("houseNo") String houseNo);
	List<HouseEntity> findAllByUserNoAndDeletedFalseOrderByHouseName(String userNo);
	Optional<HouseEntity> findByUserNo(String userNo);
	
	Optional<HouseEntity> findByroomNo(String roomNo);
}
