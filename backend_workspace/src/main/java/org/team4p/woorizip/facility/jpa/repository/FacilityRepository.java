package org.team4p.woorizip.facility.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.team4p.woorizip.facility.enums.FacilityStatus;
import org.team4p.woorizip.facility.jpa.entity.FacilityEntity;

public interface FacilityRepository extends JpaRepository<FacilityEntity, String> {
	// 건물의 시설 목록
	List<FacilityEntity> findByHouseHouseNoAndFacilityDeletedAtIsNull(String houseNo);
	// 건물 내 시설의 카테고리별 분류
	Optional<FacilityEntity> findFirstByHouse_HouseNoAndCategory_FacilityCodeOrderByFacilitySequenceDesc(String houseNo, Integer facilityCode);
	// 시설 상세 조회
	Optional<FacilityEntity> findByFacilityNoAndFacilityDeletedAtIsNull(String facilityNo);
	// FacilityStatus.UNAVAILABLE 검색
	List<FacilityEntity> findByFacilityStatus(FacilityStatus status);
}
