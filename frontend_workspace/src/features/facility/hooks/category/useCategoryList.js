// src/features/facility/hooks/category/useCategoryList.js
import { useState, useCallback, useEffect } from 'react';
import { getFacilityCategories } from '../../api/facilityApi';

export const useCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFacilityCategories();
      setCategories(data);
    } catch (err) {
      setError(err);
      console.error('카테고리 목록 로딩 실패:', err);
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
