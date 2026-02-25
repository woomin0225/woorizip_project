import { getApiBaseUrl } from '../../../app/config/env';

const API_BASE_URL = getApiBaseUrl();

function authHeader() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    ...options,
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(json?.message || 'Tour request failed');
  return json?.data ?? json;
}

export async function createTour(roomNo, payload) {
  return request(`/api/tour/insert/${roomNo}`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function getTourList() {
  const data = await request('/api/tour/list/me');
  return Array.isArray(data) ? data : [];
}
