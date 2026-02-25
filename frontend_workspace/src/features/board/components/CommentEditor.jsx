// src/features/board/components/CommentEditor.jsx
import React, { useState } from 'react';

function CommentEditor({
  initialValue = '',
  placeholder = '댓글을 입력하세요.',
  onSubmit,
  onCancel,
}) {
  const [content, setContent] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <textarea
        value={content}
        placeholder={placeholder}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        style={{ width: '100%' }}
      />

      <div style={{ marginTop: '5px' }}>
        <button onClick={handleSubmit} disabled={submitting}>
          {submitting ? '처리중...' : '저장'}
        </button>

        {onCancel && (
          <button
            onClick={() => {
              setContent(initialValue);
              onCancel();
            }}
            style={{ marginLeft: '5px' }}
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}

export default CommentEditor;
