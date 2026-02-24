// src/features/board/hooks/useEventDetail.js
import { useEffect, useState } from 'react';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import { fetchEventDetail, deleteEvent } from '../api/eventApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useEventDetail({ postNo, nav }) {
  const { isAdmin } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetchEventDetail(postNo);
      const dto = unwrapApi(resp);
      setEvent(dto || null);
    } catch (e) {
      console.error(e);
      setError('이벤트 게시글 상세보기를 불러오지 못했습니다.');
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postNo]);

  const handleDelete = async () => {
    const ok = window.confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteEvent(postNo);
      alert('삭제되었습니다.');
      nav('/events');
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
