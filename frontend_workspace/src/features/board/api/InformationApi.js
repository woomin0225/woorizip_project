// src/features/board/api/informationApi.js
import { apiJson, apiForm } from '../../../app/http/request';

// Top5 ======================================
export const fetchInformationTop5 = () => {
  return apiJson().get('/api/information/top5');
};

// 목록 ======================================
export const fetchInformationList = (params) => {
  return apiJson().get('/api/information', { params });
};

// 상세 ======================================
export const fetchInformationDetail = (postNo) => {
  return apiJson().get(`/api/information/${postNo}`);
};

// 파일 다운로드 ======================================
export const downloadInformationFile = (postNo, fileNo) => {
  return apiJson().get(`/api/information/${postNo}/filedown/${fileNo}`, {
    responseType: 'blob',
  });
};

// 조회수 증가
export function increaseInformationView(postNo) {
  return apiJson().patch(`/api/information/${postNo}/view`);
}

// 등록 (multipart)======================================
export const createInformation = (formData) => {
  return apiForm().post('/api/information', formData);
};

// 수정 (multipart)======================================
export const updateInformation = (postNo, formData) => {
  return apiForm().put(`/api/information/${postNo}/update`, formData);
};

// 삭제 ======================================
export const deleteInformation = (postNo) => {
  return apiJson().delete(`/api/information/${postNo}/delete`);
};

// 검색 ======================================
export const searchInformation = (params) => {
  return apiJson().get('/api/information/search', { params });
};
