// src/features/facility/hooks/facility/usefacilityForm.js
import { useState, useEffect, useCallback } from 'react';
import {
  createFacility,
  modifyFacility,
  getFacilityDetail,
  getFacilityCategories,
} from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared//utils/apiUnwrap';

const schema = {
  houseNo: '',
  facilityCode: '',
  facilityName: '',
  facilityOptionInfo: {},
  facilityLocation: '',
  facilityCapacity: '',
  facilityOpenTime: '',
  facilityCloseTime: '',
  facilityRsvnRequiredYn: false,
  maxRsvnPerDay: '',
  facilityRsvnUnitMinutes: '',
  facilityMaxDurationMinutes: '',
};

export function useFacilityForm(facilityNo = null) {
  const [values, setValues] = useState(initialSchema);
  const [categories, setCategories] = useState([]);
  const [optionInfoes, setOptionInfoes] = useState({});
  const [options, setOptions] = useState([]);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const updateMode = !!facilityNo;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getFacilityCategories();
        const data = unwrapApi(response);
        setCategories(data || []);
      } catch (err) {
        setError(err);
        console.error('카테고리 로딩 실패', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (updateMode) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getFacilityDetail(facilityNo);
          const data = unwrapApi(response);

          setValues({
            ...data,
            facilityOptionInfo:
              typeof data.facilityOptionInfo === 'string'
                ? JSON.parse(data.facilityOptionInfo)
                : data.facilityOptionInfo || {},
          });
          setExistingImages(data.facilityImages || []);
        } catch (err) {
          setError(err);
          console.error('시설 정보 로딩 실패');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [facilityNo, updateMode]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const onSubmit = async (e, navigate) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      const value = values[key];

      if (key === 'facilityOptionInfo' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value || '');
      }
    });

    images.forEach((file) => {
      formData.append('facilityImages', file);
    });

    try {
      const response = updateMode
        ? await modifyFacility(facilityNo, formData)
        : await createFacility(formData);

      unwrapApi({ data: response });
      alert(response.message);
      navigate('/facilities');
    } catch (err) {
      setError(err);
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    error,
    values,
    setValues,
    handleChange,
    images,
    setImages,
    existingImages,
    loading,
    submitting,
    onSubmit,
    updateMode,
  };
}
