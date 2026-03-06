import { useState, useEffect, useCallback } from 'react';
import {
  createReservation,
  modifyReservation,
  getReservationDetail,
} from '../../api/reservationApi';

const schema = {
  reservationName: '',
  reservationPhone: '',
  reservationDate: '',
  reservationStartTime: '',
  reservationEndTime: '',
  reservationStatus: ''
};

export function useReservationForm(facilityNoInput = null, reservationNo = null) {
  const [values, setValues] = useState(schema);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const updateMode = !!reservationNo;

  const facilityNo = 
    facilityNoInput && typeof facilityNoInput === 'object' 
      ? facilityNoInput.facilityNo 
      : facilityNoInput;

  useEffect(() => {
    if (updateMode && reservationNo) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getReservationDetail(reservationNo);
          
          const resData = response?.data || response;
          const target = resData?.data || resData;

          if (target) {
            setValues({
              reservationName: target.reservationName || '',
              reservationPhone: target.reservationPhone || '',
              reservationDate: target.reservationDate || '',
              reservationStartTime: target.reservationStartTime ? target.reservationStartTime.substring(0, 5) : '',
              reservationEndTime: target.reservationEndTime ? target.reservationEndTime.substring(0, 5) : '',
            });
          }
        } catch (err) {
          setError(err);
          console.error("데이터 로드 실패:", err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    } else {
      setValues(schema);
    }
  }, [reservationNo, updateMode]);

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

    try {
      let response;
      if (updateMode) {
        response = await modifyReservation(reservationNo, values);
      } else {
        response = await createReservation(facilityNo, values);
      }

      const result = response?.data || response;
      alert(result.message || '등록되었습니다.');
      
      const resNo = result.reservationNo || reservationNo;
      const targetFNo = facilityNo || result.facilityNo;
      navigate('/reservation/view');
      
    } catch (err) {
      setError(err);
      alert(err.message || '오류가 발생했습니다.');
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