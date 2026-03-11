// src/features/board/components/CommentItem.jsx
import React, { useState } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';

import CommentEditor from './CommentEditor';

function CommentItem({ comment, onReply, onEdit, onDelete }) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleReplySubmit = async (content) => {
    await onReply(comment.postNo, comment.commentNo, content);
    setIsReplying(false);
  };

  const handleEditSubmit = async (content) => {
    await onEdit(comment.commentNo, content);
    setIsEditing(false);
  };

  const { userNo } = useAuth();
  const isMyComment = userNo === comment.userNo;

  return (
    <div
      style={{
        marginLeft: comment.commentLev > 1 ? '20px' : '0px',
        marginTop: '10px',
      }}
    >
      {/* 댓글 내용 */}
      {!isEditing ? (
        <div>
          <div>
            <strong>{comment.userName}</strong>
            <span style={{ marginLeft: '10px' }}>
              {comment.commentCreatedAt}
            </span>
          </div>
          <p>{comment.commentContent}</p>

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
              onClick={() => setIsReplying(!isReplying)}
              style={{
                height: 36,
                padding: '0 14px',
                border: '1px solid #c9713f',
                background: '#c9713f',
                color: '#fff',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              답글
            </button>

            {isMyComment && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    border: '1px solid #c9713f',
                    background: '#c9713f',
                    color: '#fff',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  수정
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(comment.commentNo)}
                  style={{
                    height: 36,
                    padding: '0 14px',
                    border: '1px solid #c9713f',
                    background: '#c9713f',
                    color: '#fff',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <CommentEditor
          initialValue={comment.commentContent}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* 대댓글 작성 */}
      {isReplying && (
        <CommentEditor
          placeholder="대댓글을 입력하세요."
          onSubmit={handleReplySubmit}
          onCancel={() => setIsReplying(false)}
        />
      )}

      {/* 자식 댓글 재귀 렌더 */}
      {comment.children &&
        comment.children.map((child) => (
          <CommentItem
            key={child.commentNo}
            comment={child}
            onReply={onReply}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

export default CommentItem;
