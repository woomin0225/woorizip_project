import { useState, useEffect, useCallback } from 'react';
import {
  createReservation,
  modifyReservation,
  getReservationDetail,
  getReservationTime,
} from '../../api/reservationApi';
import { getFacilityDetail } from '../../api/facilityApi';
import { normalizeApiError } from '../../../../app/http/errorMapper';

const schema = {
  reservationName: '',
  reservationPhone: '',
  reservationDate: '',
  reservationStartTime: '',
  reservationEndTime: '',
  reservationStatus: '',
};

export function useReservationForm(
  facilityNoInput = null,
  reservationNo = null
) {
  const [values, setValues] = useState(schema);
  const [reservedList, setReservedList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [facilityDetail, setFacilityDetail] = useState(null);

  const PHONE_ONLY_MESSAGE = '연락처는 숫자만 입력 해주세요.';
  const PHONE_LENGTH_MESSAGE = '연락처는 11자리 숫자를 입력해야합니다.';
  const [phoneError, setPhoneError] = useState('');

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
              reservationPhone: String(target.reservationPhone || '')
                .replace(/[^0-9]/g, '')
                .slice(0, 11),
              reservationDate: target.reservationDate || '',
              reservationStartTime: target.reservationStartTime
                ? target.reservationStartTime.substring(0, 5)
                : '',
              reservationEndTime: target.reservationEndTime
                ? target.reservationEndTime.substring(0, 5)
                : '',
            });
          }
        } catch (err) {
          setError(err);
          console.error('데이터 로드 실패:', err.message);
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
          const response = await getReservationTime(
            facilityNo,
            values.reservationDate
          );
          const actualData = response?.data?.data || response?.data || response;
          console.log('기존 예약 데이터:', actualData);
          setReservedList(actualData || []);
        } catch (err) {
          console.error('기존 예약 시간 리스트 조회 실패:', err.message);
          setReservedList([]);
        }
      }
    };
    fetchTimes();
  }, [values.reservationDate, facilityNo]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === 'reservationPhone') {
      if (/[^0-9]/.test(value)) {
        setPhoneError(PHONE_ONLY_MESSAGE);
        return;
      }

      if (value.length > 11) {
        setPhoneError(PHONE_LENGTH_MESSAGE);
        window.alert(PHONE_LENGTH_MESSAGE);
        return;
      }

      setPhoneError('');
    }

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const onSubmit = async (e, navigate, manualValues, navigationState) => {
    if (e) e.preventDefault();

    const targetValues = manualValues || values;
    const isCancelRequest = targetValues?.reservationStatus === 'CANCELED';

    if (!isCancelRequest) {
      const phone = String(targetValues.reservationPhone || '').trim();

      if (!/^[0-9]{11}$/.test(phone)) {
        setPhoneError(PHONE_LENGTH_MESSAGE);
        window.alert(PHONE_LENGTH_MESSAGE);
        return;
      }
    }

    setSubmitting(true);

    const { reservationStatus, ...dataToCreate } = targetValues;

    try {
      let response;
      if (updateMode) {
        response = await modifyReservation(reservationNo, targetValues);
      } else {
        response = await createReservation(facilityNo, dataToCreate);
      }

      const result = response?.data || response;
      const successMessage = isCancelRequest
        ? '예약이 정상적으로 취소되었습니다.'
        : updateMode
          ? result?.message || '예약이 정상적으로 수정되었습니다.'
          : result?.message || '예약이 정상적으로 등록되었습니다.';

      alert(successMessage);
      navigate('/reservation/view', {
        state: {
          ...(navigationState || {}),
          refreshKey: Date.now(),
        },
      });
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError);
      alert(apiError.message || '오류가 발생했습니다.');
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
    phoneError,
  };
}
