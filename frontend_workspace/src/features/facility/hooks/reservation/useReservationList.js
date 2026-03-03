import { useState, useEffect, useCallback, useMemo } from 'react';
import { getReservationList } from '../../api/reservationApi';
import { useQueryState } from '../../../../shared/hooks/useQueryState';

const schema = {
  page: 1,
  size: 10,
  sort: 'reservationDate,reservationStartTime',
  direct: 'DESC',
};

export const useReservationList = (facilityNo) => {
  const { query, setQuery } = useQueryState(schema);
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
        const res = await getReservationList({ ...query, facilityNo });
        const pageData = res?.data || res;
        setResponse(pageData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, [query, facilityNo]);

  const reservationList = useMemo(() => {
    return response?.content || [];
  }, [response]);

  const pageResponse = useMemo(() => {
    if (!response) return null;
    return {
      page: response.page,
      totalPages: response.totalPages,
      totalElements: response.totalElements,
    };
  }, [response]);

  return { query, loading, error, setPage, pageResponse, reservationList };
};