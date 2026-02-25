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
  if (!response.ok) throw new Error(json?.message || 'Contract request failed');
  return json?.data ?? json;
}

export async function getMyContracts() {
  const data = await request('/api/contract/user/me');
  return Array.isArray(data) ? data : [];
}

export async function applyContract(roomNo, payload) {
  return request(`/api/contract/insert/${roomNo}`, { method: 'POST', body: JSON.stringify(payload) });
}
