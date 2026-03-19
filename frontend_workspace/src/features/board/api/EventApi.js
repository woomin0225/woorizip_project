// src/features/board/api/eventApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// Top5 ===================================
export async function fetchEventTop5() {
  const { data } = await apiJson().get('/api/event/top5');
  return data;
}

export async function fetchAdminEventList(params) {
  return apiJson().get('/api/admin/event', { params });
}

// 목록 ===================================
export async function fetchEventList(params) {
  return apiJson().get('/api/event', { params });
}

export async function searchAdminEvent(req) {
  return apiJson().get('/api/admin/event/search', {
    params: req,
  });
}

// 검색 ===================================
export async function searchEvent(req) {
  return apiJson().get('/api/event/search', {
    params: req,
  });
}

export function fetchAdminEventDetail(postNo) {
  return apiJson().get(`/api/admin/event/${postNo}`);
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

export function toggleEventVisibility(postNo) {
  return apiJson().patch(`/api/event/${postNo}/visibility`);
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
