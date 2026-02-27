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
  const [categoryError, setCategoryError] = useState(null);
  const [images, setImages] = useState([]); // 신규 업로드 파일들
  const [existingImages, setExistingImages] = useState([]); // 기존 이미지 URL들
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isUpdateMode = !!facilityNo;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getFacilityCategories();
        const data = unwrapApi(response);
        setCategories(data || []);
      } catch (err) {
        console.error('카테고리 로딩 실패', err);
        
      }
    };
    fetchCategories();
  }, []);

  // 1. [수정 모드] 기존 데이터 로드
  useEffect(() => {
    if (isUpdateMode) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const res = await getFacilityDetail(facilityNo);
          const data = unwrapApi(res);

          // 서버 데이터를 상태에 맞게 가공해서 넣어줌
          setValues({
            ...data,
            // 'Y'면 true, 'N'이면 false로 변환해서 체크박스에 연결
            facilityRsvnRequiredYn: data.facilityRsvnRequiredYn === 'Y',
            // 만약 서버에서 JSON 문자열로 온다면 파싱, 아니면 그대로
            facilityOptionInfo:
              typeof data.facilityOptionInfo === 'string'
                ? JSON.parse(data.facilityOptionInfo)
                : data.facilityOptionInfo || {},
          });
          setExistingImages(data.facilityImages || []);
        } catch (err) {
          console.error(err);
          alert('데이터를 불러오지 못했습니다.');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [facilityNo, isUpdateMode]);

  // 2. 입력값 변경 핸들러
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      // 체크박스면 checked(T/F)를 쓰고, 아니면 value를 씀
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  // 3. 제출 (등록/수정)
  const onSubmit = async (e, navigate) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();

    // DTO 규격에 맞춰서 변환하며 담기
    Object.keys(values).forEach((key) => {
      const value = values[key];

      if (key === 'facilityRsvnRequiredYn') {
        // 불리언 -> 백엔드용 Y/N 문자열로 변환
        formData.append(key, value ? 'Y' : 'N');
      } else if (key === 'facilityOptionInfo' && typeof value === 'object') {
        // 맵(객체) -> JSON 문자열로 변환
        formData.append(key, JSON.stringify(value));
      } else {
        // 나머지 문자열, 숫자 등 그대로 추가
        formData.append(key, value || '');
      }
    });

    // 이미지 파일들 추가
    images.forEach((file) => {
      formData.append('facilityImages', file);
    });

    try {
      if (isUpdateMode) {
        await modifyFacility(facilityNo, formData);
        alert('성공적으로 수정되었습니다.');
      } else {
        await createFacility(formData);
        alert('신규 등록이 완료되었습니다.');
      }
      navigate('/facilities');
    } catch (err) {
      console.error(err);
      alert(err.message || '요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    setValues,
    handleChange,
    images,
    setImages,
    existingImages,
    isLoading,
    isSubmitting,
    onSubmit,
    isUpdateMode,
  };
}
