// src/features/facility/hooks/facility/useFacilityDetail.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { getFacilityDetail } from '../../api/facilityApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';

export const useFacilityDetail = (facilityNo) => {
  const [facilityDetails, setFacilityDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFacilityDetails = useCallback(async () => {
    if (!facilityNo) return;
    try {
      setLoading(true);
      setError(null);

      const response = await getFacilityDetail(facilityNo);
      const actualData = response?.data || response;
      console.log("상세 데이터 로드 성공:", actualData);
      setFacilityDetails(actualData);
    } catch (err) {
      setError(err);
      console.error("데이터 로드 실패:", err.message);
    } finally {
      setLoading(false);
    }
  }, [facilityNo]);

  const sortedDetails = useMemo(() => {
    if (!facilityDetails) return null;

    const images = facilityDetails.images || [];
    const sortedImages = images.length > 0 
      ? [...images].sort((a, b) => a.facilityImageNo - b.facilityImageNo)
      : [];

    const rawOptions = typeof facilityDetails.facilityOptionInfo === 'string'
      ? JSON.parse(facilityDetails.facilityOptionInfo)
      : facilityDetails.facilityOptionInfo;

    const displayOptionList = rawOptions 
      ? Object.keys(rawOptions).filter(key => rawOptions[key] === true) : [];

    return {
      ...facilityDetails,
      images: sortedImages,
      displayOptionList
    };
  }, [facilityDetails]);

  useEffect(() => {
    loadFacilityDetails();
  }, [loadFacilityDetails]);

  return { facilityDetails: sortedDetails, loading, error, refresh: loadFacilityDetails };
};