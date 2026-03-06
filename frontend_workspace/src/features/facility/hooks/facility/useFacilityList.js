// src/features/facility/hooks/facility/useFacilityList.js
import { useState, useCallback, useEffect } from 'react';
import { getFacilityList } from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useFacilityList = (houseNo, isLessor, isAdmin) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isManager = isLessor || isAdmin;

  const loadFacilities = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [houseNo, isManager]);

  useEffect(() => {
    if (isLessor === null && isAdmin === null) return;
    if (isManager && !houseNo) return;

    loadFacilities();
  }, [loadFacilities, isManager, houseNo]);

  return { facilities, loading, error, refresh: loadFacilities };
};