// src/features/board/components/EventPostEditor.jsx
import React, { useRef } from 'react';
import { buildUploadUrl } from '../../../app/config/env';
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
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 15,
            color: '#333',
          }}
        >
          배너 제목
        </label>
        <input
          type="text"
          name="postTitle"
          value={form.postTitle}
          onChange={onChange}
          disabled={submitting}
          style={{
            width: '100%',
            fontSize: 16,
            padding: '12px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border 0.2s ease',
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            fontSize: 15,
            color: '#333',
          }}
        >
          <input
            type="checkbox"
            name="postVisibleYn"
            checked={form.postVisibleYn !== false}
            onChange={onChange}
            disabled={submitting}
          />
          사용자에게 이벤트를 노출합니다
        </label>
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
      <div style={{ marginTop: 20 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 15,
            color: '#333',
          }}
        >
          파일추가
        </label>

        <input
          id="event-file-upload"
          type="file"
          multiple
          onChange={(e) =>
            setNewFiles((prev) => [
              ...prev,
              ...Array.from(e.target.files || []),
            ])
          }
          disabled={submitting}
          style={{ display: 'none' }}
        />

        <label
          htmlFor="event-file-upload"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 36,
            padding: '0 14px',
            border: '1px solid #c9713f',
            background: '#c9713f',
            color: '#fff',
            borderRadius: 10,
            cursor: submitting ? 'default' : 'pointer',
            fontWeight: 800,
            fontSize: 14,
            opacity: submitting ? 0.6 : 1,
            pointerEvents: submitting ? 'none' : 'auto',
          }}
        >
          파일 선택
        </label>

        {newFiles.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {newFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                  fontSize: 14,
                }}
              >
                <span>{file.name}</span>

                <button
                  type="button"
                  onClick={() =>
                    setNewFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  disabled={submitting}
                  style={{
                    marginLeft: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: submitting ? 'default' : 'pointer',
                    fontSize: 14,
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
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

                {String(file.fileType || '').startsWith('image/') && (
                  <div style={{ margin: '8px 0 12px 22px' }}>
                    <img
                      src={buildUploadUrl('upload/event', file.updatedFileName)}
                      alt={file.originalFileName}
                      style={{
                        maxWidth: 260,
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </div>
                )}
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
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 15,
            color: '#333',
          }}
        >
          배너 내용
        </label>
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginTop: 30,
        }}
      >
        <button
          type="submit"
          disabled={submitting}
          style={{
            height: 36,
            padding: '0 14px',
            border: '1px solid #c9713f',
            background: '#c9713f',
            color: '#fff',
            borderRadius: 10,
            cursor: submitting ? 'default' : 'pointer',
            fontWeight: 800,
            fontSize: 14,
            opacity: submitting ? 0.6 : 1,
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
            height: 36,
            padding: '0 14px',
            border: '1px solid #e5c4ad',
            background: '#fff6ee',
            color: '#8a4c2d',
            borderRadius: 10,
            cursor: submitting ? 'default' : 'pointer',
            fontWeight: 800,
            fontSize: 14,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}
