// src/features/facility/hooks/category/useCategoryForm.js
import { useState, useEffect, useCallback } from 'react';
import {
  createFacilityCategory,
  modifyFacilityCategory,
  getFacilityCategories,
} from '../../api/facilityApi';
import { normalizeApiError } from '../../../../app/http/errorMapper';

const schema = {
  facilityType: '',
  facilityOptions: '',
};

export function useCategoryForm(facilityCode = null) {
  const [values, setValues] = useState(schema);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const updateMode = !!facilityCode;

  useEffect(() => {
    if (updateMode && facilityCode) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getFacilityCategories();
          const dataList = response?.data || response;
          const data = dataList.find((c) => c.facilityCode === facilityCode);
          if (data) {
            setValues({
              facilityType: data.facilityType,
              facilityOptions: Array.isArray(data.facilityOptions)
                ? data.facilityOptions.join(',')
                : data.facilityOptions || '',
            });
          }
        } catch (err) {
          const apiError = normalizeApiError(err);
          setError(apiError);
          console.error(apiError.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [facilityCode, updateMode]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const onSubmit = async (e, navigate) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const optionArray = values.facilityOptions
      ? values.facilityOptions
          .split(',')
          .map((opt) => opt.trim())
          .filter((opt) => opt !== '')
      : [];

    const payload = {
      facilityType: values.facilityType,
      facilityOptions: optionArray,
    };

    try {
      const response = updateMode
        ? await modifyFacilityCategory(facilityCode, payload)
        : await createFacilityCategory(payload);

      alert(response.message);
      navigate('/admin/category');
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError);
      alert(apiError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    handleChange,
    onSubmit,
    loading,
    submitting,
    error,
    updateMode,
  };
}
