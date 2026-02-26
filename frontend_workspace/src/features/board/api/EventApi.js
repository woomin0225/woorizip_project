// src/features/board/api/eventApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// Top3 ===================================
export async function fetchEventTop3() {
  const { data } = await apiJson().get('/api/event/top3');
  return data;
}

// 목록 ===================================
export async function fetchEventList(params) {
  return apiJson().get('/api/event', { params });
}

// 검색 ===================================
export async function searchEvent(req) {
  const { data } = await apiJson().get('/api/event/search', {
    params: req,
  });
  return data;
}

// 상세 ===================================
export function fetchEventDetail(postNo) {
  return apiJson().get(`/api/event/${postNo}`);
}

// 파일 다운로드 ===================================
export async function downloadEventFile(postNo, fileNo) {
  return apiJson().get(`/api/event/${postNo}/filedown/${fileNo}`, {
    responseType: 'blob',
  });
}

// 조회수 증가
export function increaseEventView(postNo) {
  return apiJson().patch(`/api/event/${postNo}/view`);
}

// ADMIN ===================================
export async function createEvent(formData) {
  const { data } = await apiForm().post('/api/event', formData);
  return data;
}

export async function updateEvent(postNo, formData) {
  const { data } = await apiForm().put(`/api/event/${postNo}/update`, formData);
  return data;
}

export async function deleteEvent(postNo) {
  const { data } = await apiJson().delete(`/api/event/${postNo}/delete`);
  return data;
}
