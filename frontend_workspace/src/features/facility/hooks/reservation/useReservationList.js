// src/features/facility/hooks/reservation/useReservationList.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getReservationList } from '../../api/reservationApi';
import { useQueryState } from '../../../../shared/hooks/useQueryState';
import { unwrapApi } from './../../../../shared/utils/apiUnwrap';

const schema = {
  page: 1,
  size: 10,
  sort: 'reservationDate,reservationStartTime',
  direct: 'DESC',
  facilityNo: '', 
};

export const useReservationList = (facilityNo) => {
  const { query, setQuery } = useQueryState({ 
    ...schema, 
    facilityNo: facilityNo 
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setPage = useCallback((pageNumber) => {
    setQuery({ page: pageNumber });
  }, [setQuery]);

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const data = await getReservationList(query);
        setResponse(data);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('예약 목록 로딩 실패', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [query]);

  const pageResponse = useMemo(() => {
    const apiBody = unwrapApi(response); 
    if (!apiBody) return null;
    return { ...apiBody, page: query.page };
  }, [response, query.page]);

  const reservationList = pageResponse?.content || [];

  return {
      query, 
      setQuery, 
      response,
      setResponse,
      loading,
      setLoading,
      error,
      setError,
      setPage, 
      pageResponse, 
      reservationList
  };
};