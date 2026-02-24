// src/features/board/pages/event/eventUpdate.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { fetchEventDetail, updateEvent } from '../../api/eventApi';
import { unwrapApi } from '../../../../shared/utils/apiUnwrap';
import { useAuth } from '../../../../app/providers/AuthProvider';

export default function EventUpdate() {
  const { postNo } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    postTitle: '',
    postContent: '',
  });

  const [existingFiles, setExistingFiles] = useState([]);
  const [deleteFileNos, setDeleteFileNos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  const [bannerFile, setBannerFile] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      alert('관리자만 이벤트 수정이 가능합니다.');
      navigate('/events', { replace: true });
      return;
    }

    const load = async () => {
      try {
        const resp = await fetchEventDetail(postNo);
        const dto = unwrapApi(resp);

        if (!dto) return;

        setForm({
          postTitle: dto.postTitle || '',
          postContent: dto.postContent || '',
        });

        setExistingFiles(dto.files || []);
      } catch (e) {
        console.error(e);
        alert('데이터를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [postNo, isAdmin, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDeleteFile = (fileNo) => {
    setDeleteFileNos((prev) =>
      prev.includes(fileNo)
        ? prev.filter((no) => no !== fileNo)
        : [...prev, fileNo]
    );
  };

  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';
    if (!form.postContent.trim()) return '내용을 입력하세요.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    const data = new FormData();
    data.append('postTitle', form.postTitle);
    data.append('postContent', form.postContent);

    if (bannerFile) {
      data.append('bannerFile', bannerFile);
    }

    newFiles.forEach((file) => {
      data.append('files', file);
    });

    deleteFileNos.forEach((no) => {
      data.append('deleteFileNos', no);
    });

    try {
      setSubmitting(true);
      await unwrapApi(updateEvent(postNo, data));
      alert('이벤트가 수정되었습니다.');
      navigate(`/events/${postNo}`);
    } catch (e) {
      console.error(e);
      alert('이벤트 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>로딩중...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>이벤트 수정</h2>

      <form onSubmit={handleSubmit}>
        <PostEditor
          mode="update"
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
        </div>
      </form>
    </div>
  );
}
