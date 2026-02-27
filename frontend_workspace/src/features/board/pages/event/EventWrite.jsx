// src/features/board/pages/event/eventWrite.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventWrite } from '../../hooks/useEventWrite';
import EventPostEditor from '../../components/EventPostEditor';

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
    <form onSubmit={handleSubmit}>
      <EventPostEditor
        mode={mode}
        form={form}
        onChange={onChange}
        bannerFile={bannerFile}
        setBannerFile={setBannerFile}
        newFiles={newFiles}
        setNewFiles={setNewFiles}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/event')}
      />
    </form>
  );
}
