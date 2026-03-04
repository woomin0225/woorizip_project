// src/features/board/components/PostEditor.jsx
import React from 'react';
import RichTextEditor from './RichTextEditor';
import styles from './PostEditor.module.css';

export default function PostEditor({
  mode = 'create',
  form,
  onChange,
  existingFiles = [],
  deleteFileNos = [],
  toggleDeleteFile,
  getFileUrl,
  newFiles = [],
  setNewFiles,
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const isUpdate = mode === 'update';

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isImage = (file) => {
    const name = (
      file?.originalFileName ||
      file?.updatedFileName ||
      ''
    ).toLowerCase();
    return (
      String(file?.fileType || '').startsWith('image/') ||
      name.endsWith('.png') ||
      name.endsWith('.jpg') ||
      name.endsWith('.jpeg') ||
      name.endsWith('.gif') ||
      name.endsWith('.webp')
    );
  };

  return (
    <form className={styles.container} onSubmit={onSubmit}>
      {/* 제목 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>글 제목</label>
        <input
          type="text"
          name="postTitle"
          value={form.postTitle}
          onChange={onChange}
          disabled={submitting}
          className={styles.input}
        />
      </div>

      {/* 기존 파일 (수정 모드) */}
      {existingFiles.length > 0 && (
        <div className={styles.formGroup}>
          <label className={styles.label}>기존 파일</label>

          {existingFiles.map((file) => (
            <div key={file.fileNo} className={styles.fileRow}>
              <label>
                <input
                  type="checkbox"
                  checked={deleteFileNos.includes(file.fileNo)}
                  onChange={() => toggleDeleteFile(file.fileNo)}
                  disabled={submitting}
                />
                {file.originalFileName}
              </label>

              {isImage(file) && (
                <div style={{ marginTop: 8, marginLeft: 22 }}>
                  <img
                    src={getFileUrl ? getFileUrl(file) : ''}
                    alt={file.originalFileName}
                    style={{
                      width: 160,
                      height: 120,
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: 6,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 파일 추가 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>파일 추가</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={submitting}
          className={styles.fileInput}
        />

        {newFiles.length > 0 && (
          <div className={styles.newFileList}>
            {newFiles.map((file, index) => (
              <div key={index} className={styles.fileRow}>
                {file.name}
                <button
                  type="button"
                  onClick={() => removeNewFile(index)}
                  disabled={submitting}
                  className={styles.removeBtn}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>작성 내용</label>
        <div className={styles.editorWrapper}>
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
      </div>

      {/* 버튼 */}
      <div className={styles.buttonGroup}>
        <button
          type="submit"
          disabled={submitting}
          className={styles.primaryBtn}
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
          className={styles.secondaryBtn}
        >
          취소
        </button>
      </div>
    </form>
  );
}
