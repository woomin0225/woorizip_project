import { getApiBaseUrl } from '../../../app/config/env';

const API_BASE_URL = getApiBaseUrl();

function getNormalizedAccessToken() {
  const raw = localStorage.getItem('accessToken');
  if (!raw) return null;

  let token = String(raw).trim();
  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.slice(1, -1).trim();
  }
  if (token.startsWith('Bearer ')) {
    token = token.slice('Bearer '.length).trim();
  }
  if (!token || token === 'null' || token === 'undefined') {
    return null;
  }

  if (token !== raw) {
    localStorage.setItem('accessToken', token);
  }
  return token;
}

function authHeader() {
  const token = getNormalizedAccessToken();
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

export async function getMyContractsPage(page = 1, size = 8) {
  const data = await request(`/api/contract/user/me?page=${page}&size=${size}`);
  return {
    content: Array.isArray(data?.content) ? data.content : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function applyContract(roomNo, payload) {
  return request(`/api/contract/insert/${roomNo}`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function requestContractAmendment(contractNo, payload) {
  return request(`/api/contract/amendment/request/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelContract(contractNo, reason = '') {
  return request(`/api/contract/cancel/${contractNo}`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}
