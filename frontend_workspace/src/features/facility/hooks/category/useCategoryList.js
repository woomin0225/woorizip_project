// src/features/facility/hooks/category/useCategoryList.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getFacilityCategories } from '../../api/facilityApi';
import { normalizeApiError } from '../../../../app/http/errorMapper';

export const useCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFacilityCategories();
      const actualData = response?.data || response;
      console.log('상세 데이터 로드 성공:', actualData);
      setCategories(actualData);
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError);
      console.error(apiError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const sortedCategories = useMemo(() => {
    if (!categories || categories.length == 0) return [];
    return [...categories].sort((a, b) => a.facilityCode - b.facilityCode);
  }, [categories]);

  return {
    categories: sortedCategories,
    loading,
    error,
    refresh: loadCategories,
  };
};
