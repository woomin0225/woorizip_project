// src/features/board/hooks/useQnaWrite.js
import { useEffect, useState } from 'react';
import { createQna } from '../api/QnaApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useQnaWrite({ navigate }) {
  const { isAuthed } = useAuth();

  const [form, setForm] = useState({
    postTitle: '',
    postContent: '',
  });

  const [newFiles, setNewFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  //로그인 체크
  useEffect(() => {
    if (!isAuthed) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
    }
  }, [isAuthed, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';

    const plainText = form.postContent
      .replace(/<[^>]*>/g, '')
      .replace(/%nbsp;/g, '')
      .trim();

    if (!plainText) return '내용을 입력하세요.';
    return '';
  };

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

    newFiles.forEach((file) => {
      data.append('files', file);
    });

    try {
      setSubmitting(true);
      const res = await createQna(data);

      alert(res?.message || 'Q&A 게시글 등록 성공');
      navigate('/qna', { replace: true });
    } catch (error) {
      console.error(error);
      alert('Q&A 게시글 등록에 실패했습니다.');
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
