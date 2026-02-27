// src/features/facility/hooks/category/useCategoryForm.js
import { useState, useEffect, useCallback } from 'react';
import { createFacilityCategory, modifyFacilityCategory, getFacilityCategories } from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

const schema = {
  facilityType: '',
  facilityOptions: ''
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
          const dataList = unwrapApi(response);
          const data = dataList.find(c => c.facilityCode === facilityCode);

          if (data) {
            setValues({
              facilityType: data.facilityType,
              facilityOptions: Array.isArray(data.facilityOptions) 
                ? data.facilityOptions.join(', ') 
                : data.facilityOptions || ''
            });
          }
        } catch (err) {
          setError(err);
          console.error(err.message);
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
      ? values.facilityOptions.split(',').map(opt => opt.trim()).filter(opt => opt !== '')
      : [];

    const payload = {
      facilityType: values.facilityType,
      facilityOptions: optionArray
    };

    try {
      const response = updateMode
        ? await modifyFacilityCategory(facilityCode, payload)
        : await createFacilityCategory(payload);
      
      alert(response.message);
      navigate('/admin/categories'); 
    } catch (err) {
      setError(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return { values, handleChange, onSubmit, loading, submitting, error, updateMode };
}