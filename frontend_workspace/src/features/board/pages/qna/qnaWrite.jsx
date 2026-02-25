// src/features/board/pages/qna/QnaWrite.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

import PostEditor from '../../components/PostEditor';
import { useQnaWrite } from '../../hooks/useQnaWrite';

export default function QnaWrite() {
  const navigate = useNavigate();

  const {
    mode,
    form,
    onChange,
    newFiles,
    setNewFiles,
    submitting,
    handleSubmit,
  } = useQnaWrite({ navigate });

  return (
    <PostEditor
      mode={mode}
      form={form}
      onChange={onChange}
      newFiles={newFiles}
      setNewFiles={setNewFiles}
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/qna')}
    />
  );
}
