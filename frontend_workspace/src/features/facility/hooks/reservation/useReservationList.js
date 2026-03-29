import { useState, useEffect, useCallback, useMemo } from 'react';
import { getReservationList } from '../../api/reservationApi';
import { useQueryState } from '../../../../shared/hooks/useQueryState';
import { normalizeApiError } from '../../../../app/http/errorMapper';

const schema = {
  page: 1,
  size: 10,
  sort: 'reservationDate,reservationStartTime',
  direct: 'DESC',
};

export const useReservationList = (facilityNo, targetUserNo, refreshKey) => {
  const { query, setQuery } = useQueryState(schema);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setPage = useCallback(
    (pageNumber) => {
      setQuery({ page: pageNumber });
    },
    [setQuery]
  );

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      try {
        const res = await getReservationList({
          ...query,
          facilityNo,
          targetUserNo,
        });
        const pageData = res?.data || res;
        setResponse(pageData);
      } catch (err) {
        const apiError = normalizeApiError(err);
        setError(apiError);
        console.error(apiError.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [query, facilityNo, targetUserNo, refreshKey]);

  const pageResponse = useMemo(() => {
    if (!response) return null;
    return { ...response, page: query.page };
  }, [response, query.page]);

  const reservationList = useMemo(() => {
    return pageResponse?.content || [];
  }, [pageResponse]);

  return {
    query,
    setQuery,
    loading,
    error,
    setPage,
    pageResponse,
    reservationList,
    setResponse,
  };
};
