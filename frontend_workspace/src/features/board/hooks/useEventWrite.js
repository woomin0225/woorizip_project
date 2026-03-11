// src/features/board/hooks/useEventWrite.js

import { useEffect, useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { createEvent } from '../api/EventApi';

export function useEventWrite({ navigate }) {
  const { isAuthed, isAdmin } = useAuth();

  const [form, setForm] = useState({
    postTitle: '',
    postContent: '',
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     입력 변경
  ========================= */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     유효성 검사
  ========================= */
  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';

    const plainText = form.postContent
      .replace(/<[^>]*>/g, '')
      .replace(/%nbsp;/g, '')
      .trim();

    if (!plainText) return '내용을 입력하세요.';

    if (!bannerFile) return '배너 이미지를 선택하세요.';
    return '';
  };

  /* =========================
     제출
  ========================= */
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
    data.append('bannerFile', bannerFile);

    newFiles.forEach((file) => {
      data.append('files', file);
    });

    try {
      setSubmitting(true);
      const res = await createEvent(data);

      alert(res?.message || '이벤트 등록 성공');
      navigate('/event', { replace: true });
    } catch (error) {
      console.error(error);
      alert('이벤트 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    mode: 'create',

    form,
    onChange,

    bannerFile,
    setBannerFile,

    newFiles,
    setNewFiles,

    submitting,
    handleSubmit,
  };
}
