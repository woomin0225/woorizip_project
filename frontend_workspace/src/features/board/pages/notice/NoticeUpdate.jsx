// src/features/board/pages/notice/NoticeUpdate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { useNoticeUpdate } from '../../hooks/useNoticeUpdate';
import { buildUploadUrl } from '../../../../app/config/env';

export default function NoticeUpdate() {
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

    filePreviewUrls,
    submitting,
    onSubmit,
  } = useNoticeUpdate({ postNo, nav });

  if (loading) return <div>로딩중...</div>;
  if (!canEdit) return <div>{errMsg || '권한 없음'}</div>;

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
      filePreviewUrls={filePreviewUrls}
      getFileUrl={(f) => buildUploadUrl('upload/notice', f.updatedFileName)}
      submitting={submitting}
      onSubmit={onSubmit}
      onCancel={() => nav(`/notices/${postNo}`)}
    />
  );
}
