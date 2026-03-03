// src/features/facility/hooks/facility/useFacilityList.js
import { useState, useCallback, useEffect } from 'react';
import { getFacilityList } from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useFacilityList = (houseNo) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFacilities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getFacilityList(houseNo);
      const data = unwrapApi(response);
      setFacilities(data || []);
    } catch (err) {
      setError(err);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [houseNo]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  return { facilities, loading, error, refresh: loadFacilities };
};