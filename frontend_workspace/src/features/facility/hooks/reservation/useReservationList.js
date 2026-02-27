// src/features/facility/hooks/reservation/useReservationList.js
import { useState, useEffect } from 'react';
import { getReservationList } from '../../api/reservationApi';

export const useReservationList = (facilityNo) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getReservationList(facilityNo);
      setReservations(data || []);
    } catch (err) {
      setError(err);
      console.error("예약 목록 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [facilityNo]);

  return { reservations, loading, error, refresh: loadReservations };
};