// src/features/board/hooks/useQnaComments.js
import { useEffect, useState, useCallback } from 'react';
import {
  fetchQnaCommentList,
  createQnaComment,
  createQnaReplyComment,
  updateQnaComment,
  deleteQnaComment,
} from '../api/qnaCommentApi';

export default function useQnaComments(postNo) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 댓글 목록 조회 ====================================
  const fetchComments = useCallback(async () => {
    if (!postNo) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetchQnaCommentList(postNo);
      // ApiResponse 구조
      setComments(res.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [postNo]);

  // 댓글 등록 ====================================
  const addComment = async (content) => {
    if (!content) return;
    await createQnaComment(postNo, content);
    await fetchComments();
  };

  // 대댓글 등록 ====================================
  const addReply = async (postNoParam, parentCommentNo, content) => {
    if (!content) return;
    await createQnaReplyComment(postNoParam, parentCommentNo, content);
    await fetchComments();
  };

  // 댓글 수정 ====================================
  const editComment = async (commentNo, content) => {
    if (!content) return;
    await updateQnaComment(commentNo, content);
    await fetchComments();
  };

  // 댓글 삭제 ====================================
  const removeComment = async (commentNo) => {
    await deleteQnaComment(commentNo);
    await fetchComments();
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    addReply,
    editComment,
    removeComment,
  };
}
