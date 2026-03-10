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
        style={{
          width: '100%',
          border: '1px solid #e5c4ad',
          borderRadius: 10,
          padding: '12px',
          fontSize: 14,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          marginTop: '8px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleSubmit}
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
          {submitting ? '처리중...' : '저장'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={() => {
              setContent(initialValue);
              onCancel();
            }}
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
        )}
      </div>
    </div>
  );
}

export default CommentEditor;
