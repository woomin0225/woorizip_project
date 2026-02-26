// src/features/board/hooks/useQnaUpdate.js
import { useEffect, useMemo, useState } from 'react';
import { fetchQnaDetail, updateQna } from '../api/QnaApi';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useQnaUpdate({ postNo, nav }) {
  const { isAuthed, userNo } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [newFiles, setNewFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deleteFileNos, setDeleteFileNos] = useState([]);

  const [form, setForm] = useState({
    postTitle: '',
    postContent: '',
  });

  const [ownerNo, setOwnerNo] = useState(null);

  const canEdit = useMemo(() => {
    if (!isAuthed) return false;
    if (!ownerNo || !userNo) return false;
    return String(ownerNo) === String(userNo);
  }, [isAuthed, userNo, ownerNo]);

  const load = async () => {
    if (!isAuthed) {
      setErrMsg('로그인이 필요합니다.');
      setLoading(false);
      return;
    }

    try {
      const resp = await fetchQnaDetail(postNo);
      const dto = unwrapApi(resp);

      if (!dto) {
        setErrMsg('데이터를 불러오지 못했습니다.');
        setLoading(false);
        return;
      }

      setOwnerNo(dto.userNo);

      setForm({
        postTitle: dto.postTitle || '',
        postContent: dto.postContent || '',
      });

      setExistingFiles(dto.files || []);
    } catch (e) {
      console.error(e);
      setErrMsg('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  console.log('ownerNo:', ownerNo, typeof ownerNo);
  console.log('userNo:', userNo, typeof userNo);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postNo]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';
    if (!form.postContent.trim()) return '내용을 입력하세요.';
    return '';
  };

  const toggleDeleteFile = (fileNo) => {
    setDeleteFileNos((prev) =>
      prev.includes(fileNo)
        ? prev.filter((no) => no !== fileNo)
        : [...prev, fileNo]
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!canEdit) {
      alert('작성자만 수정할 수 있습니다.');
      return;
    }

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    const data = new FormData();
    data.append('postTitle', form.postTitle);
    data.append('postContent', form.postContent);

    newFiles.forEach((file) => {
      data.append('files', file);
    });

    deleteFileNos.forEach((fileNo) => {
      data.append('deleteFileNo', fileNo);
    });

    try {
      setSubmitting(true);
      await updateQna(postNo, data);
      alert('Q&A 게시글 수정 성공');
      nav(`/qna/${postNo}`);
    } catch (e2) {
      console.error(e2);
      alert('Q&A 게시글 수정 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    mode: 'update',
    canEdit,
    loading,
    errMsg,
    form,
    existingFiles,
    deleteFileNos,
    toggleDeleteFile,
    submitting,
    newFiles,
    setNewFiles,
    onChange,
    onSubmit,
  };
}
