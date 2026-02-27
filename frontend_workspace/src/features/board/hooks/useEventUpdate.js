// src/features/board/hooks/useEventUpdate.js

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { fetchEventDetail, updateEvent } from '../api/EventApi';
import { unwrapApi } from '../../../shared/utils/apiUnwrap';

export function useEventUpdate({ postNo, navigate }) {
  const { isAdmin } = useAuth();
  const canEdit = useMemo(() => Boolean(isAdmin), [isAdmin]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [form, setForm] = useState({
    postTitle: '',
    postContent: '',
  });

  const [existingFiles, setExistingFiles] = useState([]);
  const [deleteFileNos, setDeleteFileNos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);

  /* =========================
     초기 로딩
  ========================= */
  useEffect(() => {
    if (!canEdit) {
      setLoading(false);
      setErrMsg('관리자만 이벤트 수정이 가능합니다.');
      return;
    }

    const load = async () => {
      try {
        const resp = await fetchEventDetail(postNo);
        const dto = unwrapApi(resp);

        if (!dto) {
          setErrMsg('데이터를 불러오지 못했습니다.');
          return;
        }

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

    load();
  }, [postNo, canEdit]);

  /* =========================
     입력 변경
  ========================= */
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================
     기존 파일 삭제 토글
  ========================= */
  const toggleDeleteFile = (fileNo) => {
    setDeleteFileNos((prev) =>
      prev.includes(fileNo)
        ? prev.filter((no) => no !== fileNo)
        : [...prev, fileNo]
    );
  };

  /* =========================
     유효성 검사
  ========================= */
  const validate = () => {
    if (!form.postTitle.trim()) return '제목을 입력하세요.';
    if (!form.postContent.trim()) return '내용을 입력하세요.';
    return '';
  };

  /* =========================
     제출
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

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

    deleteFileNos.forEach((fileNo) => {
      data.append('deleteFileNo', fileNo);
    });

    try {
      setSubmitting(true);
      await updateEvent(postNo, data);
      alert('이벤트 수정 성공');
      navigate(`/event/${postNo}`);
    } catch (e) {
      console.error(e);
      alert('이벤트 수정 실패');
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
  };
}
