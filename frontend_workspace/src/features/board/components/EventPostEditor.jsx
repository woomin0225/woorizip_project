// src/features/board/components/EventPostEditor.jsx
import React, { useRef } from 'react';
import RichTextEditor from './RichTextEditor';

export default function EventPostEditor({
  mode = 'create', // 'create' | 'update'

  form,
  onChange,

  bannerFile,
  setBannerFile,

  submitting = false,

  onSubmit,
  onCancel,
  newFiles = [],
  setNewFiles,
  existingFiles = [],
  deleteFileNos = [],
  toggleDeleteFile,
}) {
  const fileInputRef = useRef(null);
  const isUpdate = mode === 'update';

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setBannerFile(file); // 단일 파일만 허용
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file); // 단일 파일만 허용
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
        {isUpdate ? '이벤트 수정' : '이벤트 등록'}
      </h2>

      {/* 배너 제목 */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>배너 제목</label>
        <input
          type="text"
          name="postTitle"
          value={form.postTitle}
          onChange={onChange}
          disabled={submitting}
          style={{
            width: '100%',
            height: 40,
            padding: '0 10px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      {/* 배너 이미지 업로드 영역 */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        style={{
          border: '2px dashed #bbb',
          padding: 50,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 30,
          backgroundColor: '#fafafa',
        }}
      >
        {bannerFile
          ? `선택된 파일: ${bannerFile.name}`
          : '이미지를 드래그하거나 클릭하여 업로드하세요'}
      </div>

      {/* 🔵 첨부파일 업로드 (multiple) */}
      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>첨부파일</label>

        <input
          type="file"
          multiple
          onChange={(e) =>
            setNewFiles((prev) => [
              ...prev,
              ...Array.from(e.target.files || []),
            ])
          }
          disabled={submitting}
        />

        {/* 새 파일 목록 */}
        {newFiles.length > 0 && (
          <ul style={{ marginTop: 10 }}>
            {newFiles.map((file, idx) => (
              <li key={idx}>
                {file.name}
                <button
                  type="button"
                  onClick={() =>
                    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  style={{ marginLeft: 10 }}
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 수정 모드일 때 기존 파일 */}
        {isUpdate && existingFiles.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <div>기존 첨부파일</div>
            {existingFiles.map((file) => (
              <div key={file.fileNo}>
                <label>
                  <input
                    type="checkbox"
                    checked={deleteFileNos.includes(file.fileNo)}
                    onChange={() => toggleDeleteFile(file.fileNo)}
                  />
                  {file.originalFileName}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={submitting}
      />

      {/* 배너 내용 */}
      <div style={{ marginBottom: 30 }}>
        <label style={{ display: 'block', marginBottom: 6 }}>배너 내용</label>
        <RichTextEditor
          value={form.postContent}
          readOnly={submitting}
          onChange={(html) =>
            onChange({
              target: { name: 'postContent', value: html },
            })
          }
        />
      </div>

      {/* 버튼 */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 30px',
            marginRight: 10,
            cursor: 'pointer',
          }}
        >
          {submitting
            ? isUpdate
              ? '수정중...'
              : '등록중...'
            : isUpdate
              ? '수정'
              : '등록'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '10px 30px',
            cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
