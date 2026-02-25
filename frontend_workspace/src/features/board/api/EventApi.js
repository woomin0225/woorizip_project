// src/features/board/api/eventApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// Top3 ===================================
export async function fetchEventTop3() {
  const { data } = await apiJson.get('/api/event/top3');
  return data;
}

// 목록 ===================================
export async function fetchEventList({
  page = 1,
  size = 10,
  sort = 'postNo',
  direct = 'DESC',
}) {
  const { data } = await apiJson().get('/api/event', {
    params: { page, size, sort, direct },
  });
  return data;
}

// 검색 ===================================
export async function searchEvent(req) {
  const { data } = await apiJson().get('/api/event/search', {
    params: req,
  });
  return data;
}

// 상세 ===================================
export async function fetchEventDetail(postNo) {
  const { data } = await apiJson().get(`/api/event/${postNo}`);
  return data;
}

// 파일 다운로드 ===================================
export async function downloadEventFile(postNo, fileNo) {
  return apiJson().get(`/api/event/${postNo}/filedown/${fileNo}`, {
    responseType: 'blob',
  });
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
