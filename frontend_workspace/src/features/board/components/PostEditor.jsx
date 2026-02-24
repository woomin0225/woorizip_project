// src/features/board/components/PostEditor.jsx
import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import styles from './PostEditor.module.css';

export default function PostEditor({
  mode = 'create', // 'create' | 'update'

  form,
  onChange,

  existingFiles = [], // [{ fileNo, originalFileName }]
  deleteFileNos = [], // number[]
  toggleDeleteFile, // (fileNo) => void

  newFiles = [], // File[]
  setNewFiles, // (files) => void

  submitting = false,

  onSubmit,
  onCancel,
}) {
  const isUpdate = mode === 'update';

  // 새 파일 선택
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles((prev) => [...prev, ...files]);
  };

  // 새 파일 제거
  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ReactQuill 변경
  const handleContentChange = (value) => {
    onChange({
      target: { name: 'postContent', value },
    });
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <form className={styles.container} onSubmit={onSubmit}>
      <table className={styles.table}>
        <tbody>
          {/* 제목 */}
          <tr>
            <th className={styles.th}>제목</th>
            <td className={styles.td}>
              <input
                type="text"
                name="postTitle"
                value={form.postTitle}
                onChange={onChange}
                disabled={submitting}
                className={styles.input}
              />
            </td>
          </tr>

          {/* 기존 파일 (수정 모드일 때만 표시) */}
          {isUpdate && existingFiles.length > 0 && (
            <tr>
              <th className={styles.th}>기존 파일</th>
              <td className={styles.td}>
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
                  </div>
                ))}
              </td>
            </tr>
          )}

          {/* 새 파일 업로드 (다중 지원) */}
          <tr>
            <th className={styles.th}>파일 추가</th>
            <td className={styles.td}>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                disabled={submitting}
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
            </td>
          </tr>

          {/* 내용 */}
          <tr>
            <th className={styles.th}>내용</th>
            <td className={styles.td}>
              <div className={styles.editor}>
                <ReactQuill
                  theme="snow"
                  value={form.postContent}
                  onChange={handleContentChange}
                  modules={modules}
                  readOnly={submitting}
                />
              </div>
            </td>
          </tr>

          {/* 버튼 */}
          <tr>
            <td colSpan="2" className={styles.buttonGroup}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.button}
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
                className={styles.button}
              >
                취소
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  );
}
