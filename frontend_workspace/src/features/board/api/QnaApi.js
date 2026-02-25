// src/features/board/api/QnaApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// Top3 =========================================
export async function fetchQnaTop3() {
  const { data } = await apiJson().get('/api/qna/top3');
  return data; // ApiResponse<List<PostDto>>
}

// 목록 =========================================
export async function fetchQnaList({
  page = 1,
  size = 10,
  sort = 'postNo',
  direct = 'DESC',
}) {
  const { data } = await apiJson().get('/api/qna', {
    params: { page, size, sort, direct },
  });
  return data; // ApiResponse<PageResponse<PostDto>>
}

// 검색 =========================================
export async function searchQna(req) {
  const { data } = await apiJson().get('/api/qna/search', {
    params: req,
  });
  return data;
}

// 상세 =========================================
export async function fetchQnaDetail(postNo) {
  const { data } = await apiJson().get(`/api/qna/${postNo}`);
  return data; // ApiResponse<PostDto>
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

// 등록 =========================================
export async function createQna(formData) {
  const { data } = await apiForm().post('/api/qna', formData);
  return data;
}

// 수정 =========================================
export async function updateQna(postNo, formData) {
  const { data } = await apiForm().put(`/api/qna/${postNo}/update`, formData);
  return data;
}

// 삭제 =========================================
export async function deleteQna(postNo) {
  const { data } = await apiJson().delete(`/api/qna/${postNo}/delete`);
  return data;
}
