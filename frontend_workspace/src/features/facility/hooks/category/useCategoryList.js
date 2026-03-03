// src/features/facility/hooks/category/useCategoryList.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getFacilityCategories } from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getFacilityCategories();
      const data = unwrapApi(response);
      setCategories(data);
    } catch (err) {
      setError(err);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const sortedCategories = useMemo(() =>
    {
        if(!categories || categories.length == 0) return [];
        return [...categories].sort((a,b) => a.facilityCode - b.facilityCode);
    }, [categories]);

  return { categories: sortedCategories, loading, error, refresh: loadCategories };
};
