// src/features/facility/hooks/facility/useFacilityList.js
import { useState, useEffect } from 'react';
import { fetchFacilityList } from '../api/facilityApi';

export const useFacilityList = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const data = await fetchFacilityList();
      setFacilities(data);
    } catch (err) {
      setError(err);
      console.error("시설 목록 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  return { facilities, loading, error, refresh: loadFacilities };
};