// src/features/board/hooks/useInformationDetail.js
import { useEffect, useState, useRef } from 'react';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import {
  fetchInformationDetail,
  deleteInformation,
  increaseInformationView,
} from '../api/InformationApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useInformationDetail({ postNo, nav }) {
  const { isAdmin } = useAuth();

  const [information, setInformation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await increaseInformationView(postNo); // ① 조회수 증가

      const resp = await fetchInformationDetail(postNo); // ② 상세조회
      const dto = unwrapApi(resp);
      setInformation(dto || null);
    } catch (e) {
      console.error(e);
      setError('정책・정보 게시글 상세보기를 불러오지 못했습니다.');
      setInformation(null);
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

  const handleDelete = async () => {
    const ok = window.confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteInformation(postNo);
      alert('삭제되었습니다.');
      nav('/information');
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return {
    isAdmin,
    information,
    loading,
    deleting,
    error,
    reload: load,

    handleDelete,
  };
}
