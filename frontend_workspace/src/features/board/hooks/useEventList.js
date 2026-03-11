// src/features/board/hooks/useEventList.js
import { useEffect, useMemo, useState } from 'react';
import { useQueryState } from '../../../shared/hooks/useQueryState';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import { fetchEventList, searchEvent } from '../api/EventApi';
import { useAuth } from '../../../app/providers/AuthProvider';

const defaultQuerySchema = {
  mode: 'list', // list | search
  page: 1,
  size: 10,
  type: 'title', // title | content | date
  keyword: '',
  begin: '',
  end: '',
  sort: 'postNo',
  direct: 'DESC',
};

export function useEventList() {
  const { isAdmin } = useAuth();
  const { query, setQuery } = useQueryState(defaultQuerySchema);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [pageResponse, setPageResponse] = useState(null);

  const content = useMemo(() => pageResponse?.content || [], [pageResponse]);

  // 검색 상태 (UI 표시용) =====================================
  const search = useMemo(
    () => ({
      type: query.type,
      keyword: query.keyword,
      begin: query.begin,
      end: query.end,
    }),
    [query.type, query.keyword, query.begin, query.end]
  );

  const setSearch = (updater) => {
    if (typeof updater === 'function') {
      const next = updater(search);
      setQuery(next);
    } else {
      setQuery(updater);
    }
  };

  const setPage = (p) => setQuery({ page: p });
  const setSize = (s) => setQuery({ size: s, page: 1 });

  // 데이터 로딩 =====================================
  const load = async () => {
    setLoading(true);
    setErr('');

    try {
      const baseReq = {
        page: query.page,
        size: query.size,
        sort: query.sort,
        direct: query.direct,
      };

      let resp;

      if (query.mode === 'search') {
        const searchReq = {
          ...baseReq,
          type: query.type,
        };

        if (query.type === 'date') {
          if (!query.begin || !query.end) {
            setErr('시작일과 종료일을 모두 선택해주세요.');
            setLoading(false);
            return;
          }

          searchReq.begin = query.begin;
          searchReq.end = query.end;
        } else {
          if (!query.keyword) {
            setErr('검색어를 입력해주세요.');
            setLoading(false);
            return;
          }

          searchReq.keyword = query.keyword;
        }

        resp = await searchEvent(searchReq);
      } else {
        resp = await fetchEventList(baseReq);
      }

      const body = unwrapApi(resp);
      setPageResponse(body ? { ...body, page: query.page } : null);
    } catch (error) {
      console.error(error);
      setErr('이벤트 게시글 목록을 불러오지 못했습니다.');
      setPageResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    query.mode,
    query.page,
    query.size,
    query.type,
    query.sort,
    query.direct,
  ]);

  // 검색 동작 =====================================
  const onSubmitSearch = async (e) => {
    e.preventDefault();

    if (query.type === 'date') {
      if (!query.begin || !query.end) {
        setErr('시작일과 종료일을 모두 선택해주세요.');
        return;
      }
    } else {
      if (!query.keyword) {
        setErr('검색어를 입력해주세요.');
        return;
      }
    }

    if (query.mode === 'search' && query.page === 1) {
      load();
      return;
    }

    setQuery((prev) => ({
      ...prev,
      mode: 'search',
      page: 1,
    }));
  };

  const onReset = () => {
    setQuery({
      mode: 'list',
      page: 1,
      type: 'title',
      keyword: '',
      begin: '',
      end: '',
    });
  };

  const onChangeType = (nextType) => {
    if (nextType === 'date') {
      setQuery((prev) => ({
        ...prev,
        type: 'date',
        keyword: '',
        page: 1,
      }));
    } else {
      setQuery((prev) => ({
        ...prev,
        type: nextType,
        begin: '',
        end: '',
        page: 1,
      }));
    }
  };

  return {
    isAdmin,

    query,
    search,

    pageResponse,
    content,
    loading,
    err,

    setSearch,
    setPage,
    setSize,
    onSubmitSearch,
    onReset,
    onChangeType,
  };
}
