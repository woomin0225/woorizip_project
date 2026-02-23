package org.team4p.woorizip.facility.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;
import org.team4p.woorizip.house.jpa.entity.HouseEntity;

public interface FacilityRepository extends JpaRepository<FacilityEntity, String> {
	List<FacilityEntity> findByHouse_HouseNo(String houseNo);
	Optional<FacilityEntity> findFirstByHouse_HouseNoAndCategory_FacilityCodeOrderByFacilitySequenceDesc(HouseEntity house, Integer facilityCode);
	Optional<FacilityEntity> findByFacilityNoAndFacilityDeletedAtIsNull(String facilityNo);
}
