// src/shared/hooks/useQueryState.js

import { useState } from 'react';

/**
 * 목록/검색용 query 상태 관리 훅
 *
 * setQuery({ page: 2 })
 * setQuery(prev => ({ ...prev, keyword: '공지' }))
 */
export function useQueryState(initialState) {
  const [query, setQueryState] = useState(initialState);

  const setQuery = (updater) => {
    if (typeof updater === 'function') {
      setQueryState((prev) => ({
        ...prev,
        ...updater(prev),
      }));
    } else {
      setQueryState((prev) => ({
        ...prev,
        ...updater,
      }));
    }
  };

  return { query, setQuery };
}
