// src/features/board/api/CommentApi.js
import { apiJson } from '../../../app/http/request';

const http = apiJson();

// 댓글 목록 조회 =======================================
export const fetchQnaCommentList = async (postNo, params = {}) => {
  const { data } = await http.get(`/api/qna/${postNo}/comments`, { params });
  return data;
};

// 댓글 등록 (lev = 1) =======================================
export const createQnaComment = async (postNo, commentContent) => {
  const { data } = await http.post(`/api/qna/${postNo}/comments`, {
    commentContent,
  });
  return data;
};

// 대댓글 등록 =======================================
export const createQnaReplyComment = async (
  postNo,
  parentCommentNo,
  commentContent
) => {
  const { data } = await http.post(
    `/api/qna/${postNo}/comments/${parentCommentNo}`,
    { commentContent }
  );
  return data;
};

// 댓글 수정 =======================================
export const updateQnaComment = async (commentNo, commentContent) => {
  const { data } = await http.put(`/api/qna/comments/${commentNo}`, {
    commentContent,
  });
  return data;
};

// 댓글 삭제 =======================================
export const deleteQnaComment = async (commentNo) => {
  const { data } = await http.delete(`/api/qna/comments/${commentNo}`);
  return data;
};
