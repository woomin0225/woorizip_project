import { useState, useEffect, useCallback } from 'react';
import { createFacility, modifyFacility, getFacilityDetail, getFacilityCategories } from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

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
  facilityMaxDurationMinutes: ''
};

export function useFacilityForm(houseNo, facilityNo = null) {
  const [values, setValues] = useState({
    ...schema,
    houseNo: houseNo || '' 
  });
  const [categories, setCategories] = useState([]);
  const [defaultOptions, setDefaultOptions] = useState([]);
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
        console.error(err.message);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (updateMode && facilityNo) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getFacilityDetail(facilityNo);
          const data = unwrapApi(response);

          setValues({
            ...data,
            houseNo: houseNo,
            facilityOptionInfo:
              typeof data.facilityOptionInfo === 'string'
                ? JSON.parse(data.facilityOptionInfo)
                : data.facilityOptionInfo || {},
          });
          setExistingImages(data.images || []);
        } catch (err) {
          setError(err);
          console.error(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [facilityNo, updateMode, houseNo]);

  useEffect(() => {
    if (values.facilityCode && categories.length > 0) {
      const selectedCat = categories.find((c) => c.facilityCode === values.facilityCode);
      
      if (selectedCat && selectedCat.facilityOptions) {
        setDefaultOptions(selectedCat.facilityOptions);
        
        setValues((prev) => {
          const updatedOptionInfo = { ...prev.facilityOptionInfo };
          selectedCat.facilityOptions.forEach((opt) => {
            if (!(opt in updatedOptionInfo)) {
              updatedOptionInfo[opt] = false;
            }
          });
          return { ...prev, facilityOptionInfo: updatedOptionInfo };
        });
      }
    }
  }, [values.facilityCode, categories]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleOptionChange = useCallback((optionKey, isChecked) => {
    setValues((prev) => ({
      ...prev,
      facilityOptionInfo: {
        ...prev.facilityOptionInfo,
        [optionKey]: isChecked,
      },
    }));
  }, []);

  const addCustomOption = useCallback((customText) => {
    if (!customText.trim()) return;
    setValues((prev) => ({
      ...prev,
      facilityOptionInfo: {
        ...prev.facilityOptionInfo,
        [customText.trim()]: true,
      },
    }));
  }, []);

  const onSubmit = async (e, navigate) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();

    const finalHouseNo = values.houseNo || houseNo;

    Object.keys(values).forEach((key) => {
      const value = (key === 'houseNo') ? finalHouseNo : values[key];

      if (key === 'facilityOptionInfo') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'images' || key === 'facilityImages' || key === 'displayOptionList') {
        // 이미지 필드 후단 처리
      } else {
        formData.append(key, value ?? '');
      }
    });

    images.forEach((file) => {
      formData.append('facilityImages', file);
    });

    try {
      const response = updateMode
        ? await modifyFacility(facilityNo, formData)
        : await createFacility(formData);

      alert(response.message);
      navigate(`/facility/view/${finalHouseNo}`);
    } catch (err) {
      setError(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    setValues,
    categories,
    defaultOptions,
    handleChange,
    handleOptionChange,
    addCustomOption,
    images,
    setImages,
    existingImages,
    loading,
    submitting,
    onSubmit,
    updateMode,
    error
  };
}