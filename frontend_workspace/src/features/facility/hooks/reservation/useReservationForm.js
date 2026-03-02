// src/features/facility/hooks/reservation/useReservationForm.js
import { useState, useEffect, useCallback } from 'react';
import {
  createReservation,
  modifyReservation,
  getReservationDetail,
} from '../../api/reservationApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

const schema = {
  reservationName: '',
  reservationPhone: '',
  reservationDate: '',
  reservationStartTime: '',
  reservationEndTime: '',
};

export function useReservationForm(facilityNo = null, reservationNo = null) {
  const [values, setValues] = useState(schema);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const updateMode = !!reservationNo;

  useEffect(() => {
    if (updateMode && reservationNo) {
      const loadData = async () => {
        setLoading(true);
        try {
          const response = await getReservationDetail(reservationNo);
          const data = unwrapApi(response);

          if (data) {
            setValues({
              reservationName: data.reservationName || '',
              reservationPhone: data.reservationPhone || '',
              reservationDate: data.reservationDate || '',
              reservationStartTime: data.reservationStartTime || '',
              reservationEndTime: data.reservationEndTime || '',
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

    const payload = {
      ...values,
      facilityNo: facilityNo, 
    };

    try {
      const response = updateMode
        ? await modifyReservation(reservationNo, payload)
        : await createReservation(payload);

      alert(response.message);
      navigate(`/reservation/view/${facilityNo}/${response.reservationNo}`); 
    } catch (err) {
      setError(err);
      alert(err.message);
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