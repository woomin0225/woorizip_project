// src/features/facility/hooks/facility/useFacilityList.js
import { useState, useCallback, useEffect } from 'react';
import { getFacilityList } from '../../api/facilityApi';

// isAdmin 인자를 추가로 받도록 수정
export const useFacilityList = (houseNo, isLessor, isAdmin) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 관리자나 임대인은 권한은 있지만 houseNo가 없으면 목록을 가져오지 않음 (건물 선택 전이니까)
  const isManager = isLessor || isAdmin;

  const loadFacilities = useCallback(async () => {
    // 관리자/임대인인데 아직 건물을 선택 안 했으면 빈 배열 반환
    if (isManager && !houseNo) {
      setFacilities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getFacilityList(houseNo);
      
      const actualData = response?.data?.data || response?.data || response;
      
      console.log('건물 시설 데이터:', actualData);
      setFacilities(Array.isArray(actualData) ? actualData : []);
      
    } catch (err) {
      setError(err);
      console.error(err.message);
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }, [houseNo, isManager]); // isLessor, isAdmin 대신 통합된 isManager 사용

  useEffect(() => {
    // 권한 확인 중(null)이거나, 관리자/임대인인데 건물번호가 없는 초기 상태면 대기
    if (isLessor === null && isAdmin === null) return;
    if (isManager && !houseNo) return;

    loadFacilities();
  }, [loadFacilities, isManager, houseNo]);

  return { facilities, loading, error, refresh: loadFacilities };
};