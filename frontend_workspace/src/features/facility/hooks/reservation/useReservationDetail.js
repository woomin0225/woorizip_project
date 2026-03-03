// src/features/facility/hooks/reservation/useReservationDetail.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getReservationDetail } from '../../api/reservationApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useReservationDetail = (reservationNo) => {
  const [reservationDetails, setReservationDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReservationDetails = useCallback(async () => {
    if (!reservationNo) return;
    try {
      setLoading(true);
      setError(null);

      const response = await getReservationDetail(reservationNo);
      const data = unwrapApi(response);
      setReservationDetails(data);
    } catch (err) {
      setError(err);
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [reservationNo]);

  const sortedDetails = useMemo(() => {
    if (!reservationDetails || !reservationDetails.facilityImages)
      return reservationDetails;
    const sortedImages = [...reservationDetails.facilityImages].sort(
      (a, b) => a.facilityImageNo - b.facilityImageNo
    );
    return { ...reservationDetails, facilityImages: sortedImages };
  }, [reservationDetails]);

  useEffect(() => {
    loadReservationDetails();
  }, [loadReservationDetails]);

  return {
    reservationDetails: sortedDetails,
    loading,
    error,
    refresh: loadReservationDetails,
  };
};
