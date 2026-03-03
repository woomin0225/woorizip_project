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
        console.error('카테고리 로드 실패:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'facilityCode') {
      const selected = categories.find(c => String(c.facilityCode) === String(value));
      
      if (selected && selected.facilityOptions) {
        setDefaultOptions(selected.facilityOptions);
        const newMap = {};
        selected.facilityOptions.forEach(opt => {
          newMap[opt] = true;
        });

        setValues(prev => ({
          ...prev,
          facilityCode: value,
          facilityOptionInfo: newMap
        }));
        return;
      }
    }

    setValues(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  }, [categories]);

  useEffect(() => {
    if (updateMode && facilityNo) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getFacilityDetail(facilityNo);
          const data = response?.data || response;

          let loc = data.facilityLocation;
          if (typeof loc === 'string') {
            loc = loc.toUpperCase().startsWith('B') ? '-' + loc.substring(1) : loc;
          }

          setValues({
            ...schema,
            ...data,
            houseNo,
            facilityLocation: loc,
            facilityOptionInfo: data.facilityOptionInfo || {}, 
          });

          if (data.facilityOptionInfo) {
            setDefaultOptions(Object.keys(data.facilityOptionInfo));
          }
          
          setExistingImages(data.images || data.facilityImages || []);
          setDeleteImageNos([]);
        } catch (err) {
          console.error('상세 정보 로드 실패:', err);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [facilityNo, updateMode, houseNo]);

  const handleOptionChange = useCallback((optionKey, isChecked) => {
    setValues(prev => ({
      ...prev,
      facilityOptionInfo: {
        ...prev.facilityOptionInfo,
        [optionKey]: isChecked
      }
    }));
  }, []);

  const addCustomOption = useCallback((text) => {
    if (!text.trim()) return;
    setValues(prev => ({
      ...prev,
      facilityOptionInfo: { ...prev.facilityOptionInfo, [text.trim()]: true }
    }));
  }, []);

  const onSubmit = async (e, navigate) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();

    const dtoData = {
      ...(updateMode
        ? { deleteImageNos }
        : { houseNo: values.houseNo }),
      facilityCode: Number(values.facilityCode),
      facilityName: values.facilityName,
      facilityOptionInfo: values.facilityOptionInfo,
      facilityLocation: Number(values.facilityLocation) || 0,
      facilityCapacity: Number(values.facilityCapacity) || 0,
      facilityOpenTime: values.facilityOpenTime,
      facilityCloseTime: values.facilityCloseTime,
      facilityRsvnRequiredYn: !!values.facilityRsvnRequiredYn,
      maxRsvnPerDay: values.facilityRsvnRequiredYn ? Number(values.maxRsvnPerDay) : null,
      facilityRsvnUnitMinutes: values.facilityRsvnRequiredYn ? Number(values.facilityRsvnUnitMinutes) : null,
      facilityMaxDurationMinutes: values.facilityRsvnRequiredYn ? Number(values.facilityMaxDurationMinutes) : null,
    };

    formData.append('dto', new Blob([JSON.stringify(dtoData)], { type: 'application/json' }));
    
    images.forEach(imgFile => {
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
      alert("성공적으로 저장되었습니다.");
      navigate(`/facility/view/${houseNo}`);
    } catch (err) {
      console.error('제출 에러:', err.message);
      const serverMsg = err.response?.data?.message;
      alert(`저장 실패: ${serverMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    categories,
    defaultOptions,
    handleChange,
    handleOptionChange,
    addCustomOption,
    setImages,
    setDeleteImageNos,
    loading,
    submitting,
    onSubmit,
    updateMode,
    existingImages
  };
}
