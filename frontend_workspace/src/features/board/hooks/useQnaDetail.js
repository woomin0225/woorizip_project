// src/features/board/hooks/useQnaDetail.js
import { useEffect, useState, useRef } from 'react';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import { fetchQnaDetail, deleteQna, increaseQnaView } from '../api/QnaApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useQnaDetail({ postNo, nav }) {
  const { isAuthed, userNo, isAdmin } = useAuth();

  const [qna, setQna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await increaseQnaView(postNo); // ① 조회수 증가

      const resp = await fetchQnaDetail(postNo); // ② 상세조회
      const dto = unwrapApi(resp);
      setQna(dto || null);
    } catch (e) {
      console.error(e);
      setError('Q&A 게시글 상세보기를 불러오지 못했습니다.');
      setQna(null);
    } finally {
      setLoading(false);
    }
  };

  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postNo]);

  const isOwner =
    isAuthed && qna && (isAdmin || String(userNo) === String(qna.userNo));
  console.log('auth.userNo:', userNo);
  console.log('qna.userNo:', qna?.userNo);

  const handleDelete = async () => {
    if (!isOwner) {
      alert('작성자만 삭제할 수 있습니다.');
      return;
    }

    const ok = window.confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteQna(postNo);
      alert('삭제되었습니다');
      nav('/qna');
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return {
    qna,
    loading,
    deleting,
    error,
    isOwner,
    reload: load,
    handleDelete,
  };
}
