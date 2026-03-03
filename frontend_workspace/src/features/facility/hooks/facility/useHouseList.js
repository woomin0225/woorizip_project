// src/features/facility/hooks/facility/useHouseList.js
import { useState, useEffect, useCallback } from 'react';
import { getMyHouses } from '../../../houseAndRoom/api/houseApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useHouseList = (shouldFetch) => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHouses = useCallback(async () => {
    if (!shouldFetch) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getMyHouses();
      const actualData = response.data || response;

      setHouses(Array.isArray(actualData) ? actualData : []);
    } catch (err) {
      setError(err);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch]);

  useEffect(() => {
    if (shouldFetch) {
      loadHouses();
    }
  }, [loadHouses, shouldFetch]);

  return { houses, loading, error, refresh: loadHouses };
};
