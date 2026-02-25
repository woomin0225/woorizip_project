// src/features/board/pages/event/eventUpdate.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventUpdate } from '../../hooks/useEventUpdate';
import EventPostEditor from '../../components/EventPostEditor';

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
        <EventPostEditor
          mode={mode}
          form={form}
          onChange={onChange}
          bannerFile={bannerFile}
          setBannerFile={setBannerFile}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/events/${postNo}`)}
        />
      </form>
    </div>
  );
}
