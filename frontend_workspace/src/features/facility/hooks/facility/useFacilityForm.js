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
  facilityCategoryName: '', // ★ 이름을 담을 필드 추가
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
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const updateMode = !!facilityNo;

  // 1. 카테고리 목록 로드
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getFacilityCategories();
        const actualData = response?.data || response;
        setCategories(actualData || []);
      } catch (err) {
        console.error('카테고리 로드 실패:', err.message);
      }
    };
    fetchCategories();
  }, []);

  // 2. 상세 데이터 로드 및 이름 추출
  useEffect(() => {
    if (updateMode && facilityNo) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getFacilityDetail(facilityNo);
          const actualData = response?.data || response;

          // 층수 변환
          let rawLoc = actualData.facilityLocation;
          let formattedLoc = '';
          if (rawLoc !== undefined && rawLoc !== null) {
            const strLoc = String(rawLoc).trim().toUpperCase();
            formattedLoc = strLoc.startsWith('B') ? '-' + strLoc.substring(1) : strLoc;
          }

          // ★ 핵심: 현재 facilityCode와 일치하는 카테고리 이름 찾기
          // categories가 비어있을 수 있으므로 fetchCategories 결과나 현재 categories 활용
          const currentCat = categories.find(c => String(c.facilityCode) === String(actualData.facilityCode));
          const categoryName = currentCat ? currentCat.facilityType : '알 수 없음';

          const parsedOptions =
            typeof actualData.facilityOptionInfo === 'string'
              ? JSON.parse(actualData.facilityOptionInfo)
              : actualData.facilityOptionInfo || {};

          setExistingImages(actualData.images || actualData.facilityImages || []);

          setValues({
            ...schema,
            ...actualData,
            houseNo: houseNo,
            facilityCategoryName: categoryName, // ★ 여기에 이름 박아줌
            facilityLocation: formattedLoc,
            facilityOptionInfo: parsedOptions,
          });

          if (parsedOptions) {
            setDefaultOptions(Object.keys(parsedOptions));
          }
        } catch (err) {
          console.error('데이터 로드 실패:', err.message);
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      
      // categories가 로드된 후에 실행되도록 하거나, 내부에서 다시 체크
      if (categories.length > 0) {
        loadData();
      }
    }
  }, [facilityNo, updateMode, houseNo, categories]); // categories가 채워지면 다시 실행해서 이름 찾음

  // ... (handleChange, onSubmit 등은 동일)
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
      facilityOptionInfo: { ...prev.facilityOptionInfo, [optionKey]: isChecked },
    }));
  }, []);

  const addCustomOption = useCallback((customText) => {
    if (!customText.trim()) return;
    setValues((prev) => ({
      ...prev,
      facilityOptionInfo: { ...prev.facilityOptionInfo, [customText.trim()]: true },
    }));
  }, []);

  const onSubmit = async (e, navigate) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key === 'facilityOptionInfo') {
        formData.append(key, JSON.stringify(values[key]));
      } else if (!['images', 'facilityImages', 'displayOptionList', 'facilityCategoryName'].includes(key)) {
        formData.append(key, values[key] ?? '');
      }
    });
    images.forEach((file) => formData.append('facilityImages', file));
    try {
      const response = updateMode ? await modifyFacility(facilityNo, formData) : await createFacility(formData);
      alert((response?.data || response).message);
      navigate(`/facility/view/${houseNo}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values, categories, defaultOptions, handleChange, handleOptionChange,
    addCustomOption, images, setImages, existingImages, setExistingImages,
    loading, submitting, onSubmit, updateMode, error,
  };
}