// src/features/board/hooks/useEventDetail.js
import { useCallback, useEffect, useState } from 'react';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import {
  fetchAdminEventDetail,
  fetchEventDetail,
  deleteEvent,
  increaseEventView,
} from '../api/EventApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useEventDetail({ postNo, nav }) {
  const { isAdmin } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const resp = isAdmin
        ? await fetchAdminEventDetail(postNo)
        : await fetchEventDetail(postNo);
      const dto = unwrapApi(resp);

      if (!dto) {
        setEvent(null);
        return;
      }

      setEvent(dto);

      try {
        await increaseEventView(postNo);
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                postViewCount: (prev.postViewCount ?? 0) + 1,
              }
            : prev
        );
      } catch (viewError) {
        console.error(viewError);
      }
    } catch (e) {
      console.error(e);
      setError('이벤트 게시글 상세보기를 불러오지 못했습니다.');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, postNo]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    const ok = window.confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteEvent(postNo);
      alert('삭제되었습니다.');
      nav('/event');
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return {
    isAdmin,
    event,
    loading,
    deleting,
    error,
    reload: load,
    handleDelete,
  };
}
