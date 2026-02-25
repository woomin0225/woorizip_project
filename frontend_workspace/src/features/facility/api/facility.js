// src/features/facility/api/facility.js
import { apiJson, apiForm } from '../../../app/http/request';

// 시설 목록 조회
export async function fetchFacilityList(houseNo = "") {
  const url = houseNo ? `/api/facilities/${houseNo}` : '/api/facilities';
  const { data } = await apiJson().get(url);
  return data;
}

// 시설 신규 등록
export async function createFacility(formData) {
  const { data } = await apiForm().post('/api/facilities', formData);
  return data;
}

// 시설 카테고리 등록
export async function createFacilityCategory(categoryData) {
  const { data } = await apiJson().post('/api/facilities/categories', categoryData);
  return data;
}

// 시설 카테고리 조회
export async function fetchFacilityCategories() {
  const { data } = await apiJson().get('/api/facilities/categories');
  return data;
}

// 시설 카테고리 수정
export async function modifyFacilityCategory(facilityCode, categoryData) {
  const { data } = await apiJson().patch(`/api/facilities/categories/${facilityCode}`, categoryData);
  return data;
}

// 시설 상세 조회
export async function fetchFacilityDetail(facilityNo) {
  const { data } = await apiJson().get(`/api/facilities/${facilityNo}`);
  return data; 
}

// 시설 정보 수정
export async function modifyFacility(facilityNo, formData) {
  const { data } = await apiForm().patch(`/api/facilities/${facilityNo}`, formData);
  return data;
}