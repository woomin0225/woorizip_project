import { useState, useEffect, useCallback } from 'react';
import {
  createFacility,
  modifyFacility,
  getFacilityDetail,
  getFacilityCategories,
} from '../../api/facilityApi';

const schema = {
  houseNo: '',
  facilityCode: '',
  facilityName: '',
  facilityOptionInfo: {},
  facilityLocation: '',
  facilityStatus: '',
  blockedStartTime: '',
  blockedEndTime: '',
  facilityCapacity: '',
  facilityOpenTime: '',
  facilityCloseTime: '',
  facilityRsvnRequiredYn: false,
  maxRsvnPerDay: '',
  facilityRsvnUnitMinutes: '',
  facilityMaxDurationMinutes: '',
};

export function useFacilityForm(houseNo, facilityNo = null) {
  const [values, setValues] = useState({ ...schema, houseNo: houseNo || '' });
  const [categories, setCategories] = useState([]);
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [deleteImageNos, setDeleteImageNos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const updateMode = !!facilityNo;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getFacilityCategories();
        const data = response?.data || response || [];
        setCategories(data);
      } catch (err) {
        setError(err);
        console.error('카테고리 로드 실패:', err.message);
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
          const data = response?.data || response;

          let loc = data.facilityLocation;
          if (typeof loc === 'string') {
            loc = loc.toUpperCase().startsWith('B')
              ? '-' + loc.substring(1)
              : loc;
          }

          setValues({
            ...schema,
            ...data,
            houseNo,
            facilityLocation: loc,
            facilityOptionInfo: data.facilityOptionInfo || {},
          });

          setExistingImages(data.images || data.facilityImages || []);
          setDeleteImageNos([]);
        } catch (err) {
          setError(err);
          console.error('상세 정보 로드 실패:', err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [facilityNo, updateMode, houseNo]);

  useEffect(() => {
    if (categories.length > 0 && values.facilityCode) {
      const matchedCategory = categories.find(
        (c) => String(c.facilityCode) === String(values.facilityCode)
      );
      if (matchedCategory && matchedCategory.facilityOptions) {
        setDefaultOptions(matchedCategory.facilityOptions);
      }
    }
  }, [categories, values.facilityCode]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;

      if (name === 'facilityCode') {
        const selected = categories.find(
          (c) => String(c.facilityCode) === String(value)
        );
        if (selected && selected.facilityOptions) {
          setDefaultOptions(selected.facilityOptions);
          const newMap = {};
          selected.facilityOptions.forEach((opt) => {
            newMap[opt] = true;
          });

          setValues((prev) => ({
            ...prev,
            facilityCode: value,
            facilityOptionInfo: newMap,
          }));
          return;
        }
      }

      setValues((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    },
    [categories]
  );

  const handleOptionChange = useCallback((optionKey, isChecked) => {
    setValues((prev) => ({
      ...prev,
      facilityOptionInfo: {
        ...prev.facilityOptionInfo,
        [optionKey]: isChecked,
      },
    }));
  }, []);

  const addCustomOption = useCallback((text) => {
    if (!text.trim()) return;
    setValues((prev) => ({
      ...prev,
      facilityOptionInfo: { ...prev.facilityOptionInfo, [text.trim()]: true },
    }));
  }, []);

  const onSubmit = async (e, navigate, manualValues = null) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const currentValues = manualValues || values;
    const formData = new FormData();
    const truncateToHour = (dateTimeStr) => {
      if (!dateTimeStr) return null;
      return dateTimeStr.split(':')[0] + ':00:00';
    };

    const dtoData = {
      ...(updateMode ? { deleteImageNos } : { houseNo: values.houseNo }),
      facilityCode: Number(currentValues.facilityCode),
      facilityName: currentValues.facilityName,
      facilityOptionInfo: currentValues.facilityOptionInfo,
      facilityLocation: String(currentValues.facilityLocation) || '0',
      facilityStatus:
        currentValues.facilityStatus || (updateMode ? undefined : 'AVAILABLE'),
      blockedStartTime:
        currentValues.facilityStatus === 'UNAVAILABLE'
          ? truncateToHour(currentValues.blockedStartTime)
          : null,
      blockedEndTime:
        currentValues.facilityStatus === 'UNAVAILABLE'
          ? truncateToHour(currentValues.blockedEndTime)
          : null,
      facilityCapacity: Number(currentValues.facilityCapacity) || 0,
      facilityOpenTime: currentValues.facilityOpenTime,
      facilityCloseTime: currentValues.facilityCloseTime,
      facilityRsvnRequiredYn: !!currentValues.facilityRsvnRequiredYn,
      maxRsvnPerDay: currentValues.facilityRsvnRequiredYn
        ? Number(currentValues.maxRsvnPerDay)
        : null,
      facilityRsvnUnitMinutes: currentValues.facilityRsvnRequiredYn
        ? Number(currentValues.facilityRsvnUnitMinutes)
        : null,
      facilityMaxDurationMinutes: currentValues.facilityRsvnRequiredYn
        ? Number(currentValues.facilityMaxDurationMinutes)
        : null,
    };

    formData.append(
      'dto',
      new Blob([JSON.stringify(dtoData)], { type: 'application/json' })
    );

    images.forEach((imgFile) => {
      if (imgFile instanceof File) {
        formData.append('files', imgFile);
      }
    });

    try {
      if (updateMode) {
        await modifyFacility(facilityNo, formData);
      } else {
        await createFacility(formData);
      }
      alert('성공적으로 저장되었습니다.');
      navigate(`/facility/view/${houseNo}`);
    } catch (err) {
      setError(err);
      console.error('제출 에러:', err.message);
      alert('저장 실패', err.message);
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
    setDeleteImageNos,
    loading,
    submitting,
    onSubmit,
    updateMode,
    existingImages,
    error,
  };
}
