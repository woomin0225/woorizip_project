// src/features/board/components/CommentBox.jsx
import React from 'react';
import useQnaComments from '../../hooks/useQnaComments';
import CommentItem from './CommentItem';
import CommentEditor from './CommentEditor';

function CommentBox({ postNo }) {
  const {
    comments,
    loading,
    error,
    addComment,
    addReply,
    editComment,
    removeComment,
  } = useQnaComments(postNo);

  if (!postNo) return null;

  return (
    <div>
      <h3>댓글</h3>

      {/* 댓글 작성 */}
      <CommentEditor
        placeholder="댓글을 입력하세요."
        onSubmit={(content) => addComment(content)}
      />

      {/* 로딩 */}
      {loading && <p>불러오는 중...</p>}

      {/* 에러 */}
      {error && <p>댓글을 불러오지 못했습니다.</p>}

      {/* 댓글 목록 */}
      {!loading &&
        comments.map((comment) => (
          <CommentItem
            key={comment.commentNo}
            comment={comment}
            onReply={addReply}
            onEdit={editComment}
            onDelete={removeComment}
          />
        ))}
    </div>
  );
}

export default CommentBox;
