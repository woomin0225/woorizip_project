// src/features/board/hooks/useNoticeList.js
import { useEffect, useMemo, useState } from 'react';
import { useQueryState } from '../../../shared/hooks/useQueryState';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import { fetchNoticeList, searchNotice } from '../api/NoticeApi';
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

export function useNoticeList() {
  const { isAdmin } = useAuth();
  const { query, setQuery } = useQueryState(defaultQuerySchema);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [pageResponse, setPageResponse] = useState(null);

  const content = useMemo(() => pageResponse?.content || [], [pageResponse]);

  // 화면 표시용 search object
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
        resp = await searchNotice({
          ...baseReq,
          type: query.type,
          keyword: query.keyword,
          begin: query.begin,
          end: query.end,
        });
      } else {
        resp = await fetchNoticeList(baseReq);
      }

      const body = unwrapApi(resp);
      // PagingView가 현재 page를 표시하므로 page를 query에서 주입
      setPageResponse(body ? { ...body, page: query.page } : null);
    } catch (e) {
      console.error(e);
      setErr('공지사항 게시글 목록을 불러오지 못했습니다.');
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
    query.keyword,
    query.begin,
    query.end,
    query.sort,
    query.direct,
  ]);

  const onSubmitSearch = async (e) => {
    e.preventDefault();
    setQuery({ mode: 'search', page: 1 });
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

  // type 변경 시 UI 입력값 정리(기간/키워드)
  const onChangeType = (nextType) => {
    if (nextType === 'date') {
      setQuery({ type: 'date', keyword: '', page: 1 });
    } else {
      setQuery({ type: nextType, begin: '', end: '', page: 1 });
    }
  };

  return {
    isAdmin,

    // query-backed state
    query,
    search,

    // derived state
    pageResponse,
    content,
    loading,
    err,

    // actions
    setSearch,
    setPage,
    setSize,
    onSubmitSearch,
    onReset,
    onChangeType,
  };
}
