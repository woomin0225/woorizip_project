// src/features/board/pages/qna/QnaUpdate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { useQnaUpdate } from '../../hooks/useQnaUpdate';

export default function QnaUpdate() {
  const { postNo } = useParams();
  const nav = useNavigate();

  const {
    canEdit,
    loading,
    errMsg,
    mode,
    form,
    onChange,

    existingFiles,
    deleteFileNos,
    toggleDeleteFile,

    newFiles,
    setNewFiles,

    submitting,
    onSubmit,
  } = useQnaUpdate({ postNo, nav });

  if (loading) return <div>로딩중...</div>;
  if (!canEdit) return <div>{errMsg || '권한이 없습니다.'}</div>;

  return (
    <PostEditor
      mode={mode}
      form={form}
      onChange={onChange}
      existingFiles={existingFiles}
      deleteFileNos={deleteFileNos}
      toggleDeleteFile={toggleDeleteFile}
      newFiles={newFiles}
      setNewFiles={setNewFiles}
      submitting={submitting}
      onSubmit={onSubmit}
      onCancel={() => nav(`/qna/${postNo}`)}
    />
  );
}
