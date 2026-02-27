// src/features/facility/hooks/facility/usefacilityDetail.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getFacilityDetail } from '../../api/facilityApi';

export const useFacilityDetail = (facilityNo) => {
  const [facilityDetails, setFacilityDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFacilityDetails = useCallback(async () => {
    if (!facilityNo) return;
    try {
      setLoading(true);
      setError(null);

      const data = await getFacilityDetail(facilityNo);
      setFacilityDetails(data);
    } catch (err) {
      setError(err);
      console.error('시설 정보 로딩 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [facilityNo]);

  const sortedDetails = useMemo(() => {
    if (!facilityDetails || !facilityDetails.images) return facilityDetails;
    const sortedImages = [...facilityDetails.images].sort((a, b) => a.facilityImageNo - b.facilityImageNo);
    return {...facilityDetails, images: sortedImages}
  }, [facilityDetails]);

  useEffect(() => {
    loadFacilityDetails();
  }, [loadFacilityDetails]);

  return { facilityDetails: sortedDetails, loading, error, refresh: loadFacilityDetails };
};
