// src/features/facility/hooks/facility/useHouseList.js
import { useState, useEffect } from 'react';
import { getMyHouses } from '../../../houseAndRoom/api/houseApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useHouseList = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getMyHouses();
      const data = unwrapApi(response);
      setHouses(data || []);
    } catch (err) {
      setError(err);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHouses();
  }, [loadHouses]);

  return { houses, loading, error, refresh: loadHouses };
};