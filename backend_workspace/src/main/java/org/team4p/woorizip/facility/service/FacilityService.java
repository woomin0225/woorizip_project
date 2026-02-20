package org.team4p.woorizip.facility.service;

import java.util.List;
import org.team4p.woorizip.facility.dto.*;

public interface FacilityService {
	List<FacilityListResponseDTO> getFacilityList(String houseNo); // 시설 목록 조회
	void createFacility(FacilityCreateRequestDTO dto, String currentUserNo); // 시설 신규 등록 void
	void createCategory(FacilityCategoryCreateRequestDTO dto); // 시설 카테고리 등록
	List<FacilityCategoryDTO> getFacilityCategory(); // 시설 카테고리 조회
	void modifyFacilityCategory(Integer facilityCode, FacilityCategoryDTO dto); // 시설 카테고리 수정
	FacilityDetailResponseDTO getFacilityDetails(String facilityNo); // 시설 상세 조회
	void modifyFacility(String facilityNo, FacilityModifyRequestDTO dto, String userNo); // 시설 정보 수정
}
