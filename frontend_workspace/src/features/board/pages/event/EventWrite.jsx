// src/features/board/pages/event/eventWrite.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { useEventWrite } from '../../hooks/useEventWrite';

export default function EventWrite() {
  const navigate = useNavigate();

  const {
    mode,
    form,
    onChange,
    bannerFile,
    setBannerFile,
    newFiles,
    setNewFiles,
    submitting,
    handleSubmit,
  } = useEventWrite({ navigate });

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>이벤트 등록</h2>

      <form onSubmit={handleSubmit}>
        <PostEditor
          mode={mode}
          form={form}
          onChange={onChange}
          newFiles={newFiles}
          setNewFiles={setNewFiles}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/events')}
        />

        <div style={{ marginTop: 20 }}>
          <label>배너 이미지</label>
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
