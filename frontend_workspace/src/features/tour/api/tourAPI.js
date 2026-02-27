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
  if (!response.ok) throw new Error(json?.message || 'Tour request failed');
  return json?.data ?? json;
}

async function requestCandidates(candidates = [], options = {}) {
  let lastError = null;
  for (const path of candidates) {
    try {
      return await request(path, options);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Tour request failed');
}

function normalizeTourStatus(item) {
  if (!item || typeof item !== 'object') return item;
  const status = String(item.status || '').toUpperCase();
  if (status === 'PENDING') {
    return { ...item, status: 'APPROVED' };
  }
  return item;
}

export async function createTour(roomNo, payload) {
  const data = await request(`/api/tour/insert/${roomNo}`, { method: 'POST', body: JSON.stringify(payload) });
  return normalizeTourStatus(data);
}

export async function getTourPage(page = 1, size = 8) {
  const data = await request(`/api/tour/list/me?page=${page}&size=${size}`);
  return {
    content: Array.isArray(data?.content) ? data.content.map(normalizeTourStatus) : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function getOwnerTourPage(page = 1, size = 8) {
  const data = await requestCandidates([
    `/api/tour/list/owner?page=${page}&size=${size}`,
    `/api/tour/owner/list?page=${page}&size=${size}`,
    `/api/tour/list/lessor?page=${page}&size=${size}`,
  ]);
  return {
    content: Array.isArray(data?.content) ? data.content.map(normalizeTourStatus) : [],
    page: Number(data?.page || page),
    size: Number(data?.size || size),
    totalElements: Number(data?.totalElements || 0),
    totalPages: Number(data?.totalPages || 0),
  };
}

export async function getTour(tourNo) {
  const data = await request(`/api/tour/${tourNo}`);
  return normalizeTourStatus(data);
}

export async function updateTour(tourNo, payload) {
  return request(`/api/tour/update/${tourNo}`, { method: 'POST', body: JSON.stringify(payload) });
}

export async function decideTour(tourNo, status, reason = '') {
  const normalizedStatus = String(status || '').toUpperCase();
  const body = JSON.stringify({
    status: normalizedStatus,
    rejectionReason: normalizedStatus === 'REJECTED' ? reason : '',
  });
  return requestCandidates(
    [
      `/api/tour/approve/${tourNo}`,
      `/api/tour/decision/${tourNo}`,
      `/api/tour/status/${tourNo}`,
      `/api/tour/update/${tourNo}`,
    ],
    { method: 'POST', body }
  );
}
