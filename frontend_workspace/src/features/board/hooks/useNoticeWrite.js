// src/features/board/hooks/useNoticeWrite.js
import { useEffect, useState } from 'react';
import { createNotice } from '../api/noticeApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useNoticeWrite({ navigate }) {
  const { isAuthed, isAdmin } = useAuth();

  const [form, setForm] = useState({
    postTitle: '',
    postContent: '',
  });

  // 🔥 다중 파일 구조
  const [newFiles, setNewFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);

  // 권한 체크
  useEffect(() => {
    if (!isAuthed) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
      return;
    }

    if (!isAdmin) {
      alert('관리자만 공지글 등록이 가능합니다.');
      navigate('/notices', { replace: true });
    }
  }, [isAuthed, isAdmin, navigate]);

  // 제목 / 내용 변경
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 유효성 검사
  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';
    if (!form.postContent.trim()) return '내용을 입력하세요.';
    return '';
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    const data = new FormData();
    data.append('postTitle', form.postTitle);
    data.append('postContent', form.postContent);

    // 다중 파일 append
    newFiles.forEach((file) => {
      data.append('files', file);
    });

    try {
      setSubmitting(true);

      const res = await createNotice(data);

      alert(res?.message || '공지글 등록 성공');
      navigate('/notices', { replace: true });
    } catch (error) {
      console.error(error);
      alert('공지글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    mode: 'create',

    form,
    onChange,

    newFiles,
    setNewFiles,

    submitting,

    handleSubmit,
  };
}
