import { useState, useEffect } from 'react';
import { getReservationDetail } from '../../api/reservationApi';

export const useReservationDetail = (reservationNo) => {
  const [reservationDetails, setReservationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reservationNo) return;

    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await getReservationDetail(reservationNo);
        const actualData = res?.data || res;
        
        console.log('상세 데이터 로드 성공:', actualData);
        setReservationDetails(actualData);
      } catch (err) {
        setError(err);
        console.error('상세 조회 에러:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reservationNo]);

  return { reservationDetails, loading, error };
};