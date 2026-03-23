// src/features/board/pages/notice/NoticeWrite.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiAssetUrl } from '../../../../app/config/env';
import { useNoticeWrite } from '../../hooks/useNoticeWrite';
import PostEditor from '../../components/PostEditor';

export default function NoticeWrite() {
  const navigate = useNavigate();

  const {
    mode,
    form,
    onChange,
    newFiles,
    setNewFiles,
    filePreviewUrls,
    submitting,
    handleSubmit,
  } = useNoticeWrite({ navigate });

  return (
    <PostEditor
      mode={mode}
      form={form}
      onChange={onChange}
      newFiles={newFiles}
      setNewFiles={setNewFiles}
      filePreviewUrls={filePreviewUrls}
      getFileUrl={(f) =>
        getApiAssetUrl(`/upload/notice/${f.updatedFileName}`)
      }
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/notices')}
    />
  );
}
