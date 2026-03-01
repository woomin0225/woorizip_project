// src/features/board/api/QnaApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// Top3 =========================================
export async function fetchQnaTop3() {
  const { data } = await apiJson().get('/api/qna/top3');
  return data; // ApiResponse<List<PostDto>>
}

// 목록 =========================================
export function fetchQnaList(params) {
  return apiJson().get('/api/qna', { params });
}

// 검색 =========================================
export async function searchQna(req) {
  return apiJson().get('/api/qna/search', {
    params: req,
  });
}

// 상세 =========================================
export function fetchQnaDetail(postNo) {
  return apiJson().get(`/api/qna/${postNo}`);
}

// 파일 다운로드 =========================================
export function getQnaFileDownloadUrl(postNo, fileNo) {
  return `/api/qna/${postNo}/filedown/${fileNo}`;
}

export async function downloadQnaFile(postNo, fileNo) {
  return apiJson().get(`/api/qna/${postNo}/filedown/${fileNo}`, {
    responseType: 'blob',
  });
}

// 조회수 증가
export function increaseQnaView(postNo) {
  return apiJson().patch(`/api/qna/${postNo}/view`);
}

// 등록 =========================================
export function createQna(formData) {
  return apiForm().post('/api/qna', formData);
}

// 수정 =========================================
export function updateQna(postNo, formData) {
  return apiForm().put(`/api/qna/${postNo}/update`, formData);
}

// 삭제 =========================================
export function deleteQna(postNo) {
  return apiJson().delete(`/api/qna/${postNo}/delete`);
}
