import { useState, useEffect, useCallback } from 'react';
import {
  createReservation,
  modifyReservation,
  getReservationDetail,
  getReservationTime
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
  const [reservedList, setReservedList] = useState([]);
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

  useEffect(() => {
    const fetchTimes = async () => {
      if (values.reservationDate && facilityNo) {
        try {
          const response = await getReservationTime(facilityNo, values.reservationDate);
          const data = response?.data || response; 
          setReservedList(data || []);
        } catch (err) {
          console.error("기존 예약 시간 리스트 조회 실패:", err.message);
          setReservedList([]);
        }
      }
    };
    fetchTimes();
  }, [values.reservationDate, facilityNo]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const onSubmit = async (e, navigate, manualValues) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    const targetValues = manualValues || values;
    const { reservationStatus, ...dataToCreate } = targetValues;

    try {
      let response;
      if (updateMode) {
        response = await modifyReservation(reservationNo, targetValues);
      } else {
        response = await createReservation(facilityNo, dataToCreate);
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
    reservedList,
    handleChange,
    onSubmit,
    loading,
    submitting,
    error,
    updateMode,
  };
}