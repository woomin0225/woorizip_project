// src/features/board/api/noticeApi.js
import { apiJson, apiForm } from '../../../app/http/request';

//고정글 분리
export async function fetchNoticePinned() {
  return apiJson().get('/api/notice/pinned');
}

// 상단 고정
export function toggleNoticePin(postNo) {
  return apiJson().patch(`/api/notice/${postNo}/pin`);
}

// Top5 (최신 공지)
export async function fetchNoticeTop5() {
  const { data } = await apiJson().get('/api/notice/top5');
  return data; // ApiResponse<List<NoticeDto>>
}

export async function fetchNoticeList(params) {
  return apiJson().get('/api/notice', { params });
}

export async function searchNotice(req) {
  return apiJson().get('/api/notice/search', { params: req });
}

export function fetchNoticeDetail(postNo) {
  return apiJson().get(`/api/notice/${postNo}`);
}

// (참고용: 토큰 없이 a href로 호출하면 실패 가능)
export function getNoticeFileDownloadUrl(postNo, fileNo) {
  return `/api/notice/${postNo}/filedown/${fileNo}`;
}

/**
 * 파일 다운로드 (JWT 포함 + Blob)
 * - 반드시 responseType: 'blob'
 */
export async function downloadNoticeFile(postNo, fileNo) {
  return apiJson().get(`/api/notice/${postNo}/filedown/${fileNo}`, {
    responseType: 'blob',
  });
}

// 조회수 증가
export function increaseNoticeView(postNo) {
  return apiJson().patch(`/api/notice/${postNo}/view`);
}

// ADMIN
export async function createNotice(formData) {
  const { data } = await apiForm().post('/api/notice', formData);
  return data;
}
export async function updateNotice(postNo, formData) {
  const { data } = await apiForm().put(
    `/api/notice/${postNo}/update`,
    formData
  );
  return data;
}
export async function deleteNotice(postNo) {
  const { data } = await apiJson().delete(`/api/notice/${postNo}/delete`);
  return data;
}
