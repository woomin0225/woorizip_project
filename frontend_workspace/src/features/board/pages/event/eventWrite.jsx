// src/features/board/pages/event/eventWrite.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PostEditor from '../../components/PostEditor';
import { createEvent } from '../../api/eventApi';
import { useAuth } from '../../../app/providers/AuthProvider';

export default function EventWrite() {
  const navigate = useNavigate();
  const { isAuthed, isAdmin } = useAuth();

  const [form, setForm] = React.useState({
    postTitle: '',
    postContent: '',
  });

  const [newFiles, setNewFiles] = React.useState([]);
  const [bannerFile, setBannerFile] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthed) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
      return;
    }

    if (!isAdmin) {
      alert('관리자만 이벤트 등록이 가능합니다.');
      navigate('/events', { replace: true });
    }
  }, [isAuthed, isAdmin, navigate]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';
    if (!form.postContent.trim()) return '내용을 입력하세요.';
    if (!bannerFile) return '배너 이미지를 선택하세요.';
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
    data.append('banner', bannerFile);

    newFiles.forEach((file) => {
      data.append('files', file);
    });

    try {
      setSubmitting(true);
      const res = await createEvent(data);
      alert(res?.message || '이벤트 등록 성공');
      navigate('/events', { replace: true });
    } catch (error) {
      console.error(error);
      alert('이벤트 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>이벤트 등록</h2>

      <form onSubmit={handleSubmit}>
        <PostEditor
          mode="create"
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
        </div>
      </form>
    </div>
  );
}
