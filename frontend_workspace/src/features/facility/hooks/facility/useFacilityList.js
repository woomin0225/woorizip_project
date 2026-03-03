// src/features/facility/hooks/facility/useFacilityList.js
import { useState, useCallback, useEffect } from 'react';
import { getFacilityList } from '../../api/facilityApi';

export const useFacilityList = (houseNo, isLessor) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFacilities = useCallback(async () => {
    if (isLessor && !houseNo) {
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
  }, [houseNo, isLessor]);

  useEffect(() => {
    if (isLessor === null || (isLessor && !houseNo)) {
      return;
    }

    loadFacilities();
  }, [loadFacilities, isLessor, houseNo]);

  return { facilities, loading, error, refresh: loadFacilities };
};