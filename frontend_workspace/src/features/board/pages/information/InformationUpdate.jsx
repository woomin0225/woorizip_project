// src/features/board/pages/Information/informationUpdate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiAssetUrl } from '../../../../app/config/env';
import PostEditor from '../../components/PostEditor';
import { useInformationUpdate } from '../../hooks/useInformationUpdate';

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
        getApiAssetUrl(`/upload_files/information/${f.updatedFileName}`)
      }
      onCancel={() => nav(`/information/${postNo}`)}
    />
  );
}
