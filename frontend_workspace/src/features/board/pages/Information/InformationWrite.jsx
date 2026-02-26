// src/features/board/pages/Information/informationWrite.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useInformationWrite } from '../../hooks/useInformationWrite';
import PostEditor from '../../components/PostEditor';

export default function InformationWrite() {
  const navigate = useNavigate();

  const {
    mode,
    form,
    onChange,
    newFiles,
    setNewFiles,
    submitting,
    handleSubmit,
  } = useInformationWrite({ navigate });

  return (
    <PostEditor
      mode={mode}
      form={form}
      onChange={onChange}
      newFiles={newFiles}
      setNewFiles={setNewFiles}
      submitting={submitting}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/information')}
    />
  );
}
