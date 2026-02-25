// src/features/board/pages/event/eventUpdate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { useEventUpdate } from '../../hooks/useEventUpdate';

export default function EventUpdate() {
  const { postNo } = useParams();
  const navigate = useNavigate();

  const {
    mode,
    canEdit,
    loading,
    errMsg,

    form,
    onChange,

    existingFiles,
    deleteFileNos,
    toggleDeleteFile,

    newFiles,
    setNewFiles,

    bannerFile,
    setBannerFile,

    submitting,
    handleSubmit,
  } = useEventUpdate({ postNo, navigate });

  if (loading) return <div>로딩중...</div>;
  if (!canEdit) return <div>{errMsg || '권한 없음'}</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>이벤트 수정</h2>

      <form onSubmit={handleSubmit}>
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
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/events/${postNo}`)}
        />

        <div style={{ marginTop: 20 }}>
          <label>배너 이미지 변경</label>
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBannerFile(e.target.files[0])}
            disabled={submitting}
          />
          {bannerFile && (
            <div style={{ marginTop: 8 }}>선택된 파일: {bannerFile.name}</div>
          )}
        </div>
      </form>
    </div>
  );
}
