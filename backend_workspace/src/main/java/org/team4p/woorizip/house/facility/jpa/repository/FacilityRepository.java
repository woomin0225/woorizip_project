package org.team4p.woorizip.facility.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;

public interface FacilityRepository extends JpaRepository<FacilityEntity, String> {
	List<FacilityEntity> findByHouseNoAndFacilityDeletedAtIsNull(String houseNo);
	Optional<FacilityEntity> findByFacilityNoAndFacilityDeletedAtIsNull(String facilityNo);
}
