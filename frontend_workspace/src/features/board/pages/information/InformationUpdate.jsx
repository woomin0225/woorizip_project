// src/features/board/pages/Information/informationUpdate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { useInformationUpdate } from '../../hooks/useInformationUpdate';
import { buildUploadUrl } from '../../../../app/config/env';

export default function InformationUpdate() {
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
  } = useInformationUpdate({ postNo, nav });

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
      submitting={submitting}
      onSubmit={onSubmit}
      getFileUrl={(f) =>
        buildUploadUrl('upload/information', f.updatedFileName)
      }
      onCancel={() => nav(`/information/${postNo}`)}
    />
  );
}
